import type { Page } from "@playwright/test";
import type { Client } from "pg";
import { answer, expect, test } from "./fixtures";

interface Row {
  name: string;
  aid: string;
  profile_id: string;
  props: Record<string, unknown>;
}

const recorder = process.env.ANALYTICS_CLICKHOUSE_URL;
const noId = "00000000-0000-0000-0000-000000000000";

test.skip(!recorder, "needs ANALYTICS_CLICKHOUSE_URL pointing at the recorder");

const recorded = async (name: string, match: (row: Row) => boolean) =>
  ((await (await fetch(`${recorder}/rows`)).json()) as Row[]).filter(
    (row) => row.name === name && match(row),
  );

const aidOf = async (page: Page) =>
  (await page.context().cookies()).find(({ name }) => name === "aid")?.value;

const flush = (page: Page) =>
  page.evaluate(() => dispatchEvent(new Event("pagehide")));

const accountProfile = async (db: Client, userId: string) =>
  (await db.query(`select id from profiles where user_id = $1`, [userId]))
    .rows[0]?.id;

async function solveAsGuest(page: Page) {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  const aid = await aidOf(page);
  const created = () => recorded("profile_created", (row) => row.aid === aid);
  await expect.poll(created).toHaveLength(1);
  const [guest] = await created();
  expect(guest?.props).toEqual({ kind: "guest" });
  return guest?.profile_id;
}

test("an account gets and records its profile on its first action", async ({
  page,
  auth,
}) => {
  const { userId, profileId } = await auth.signIn();
  await auth.db.query(`delete from profiles where id = $1`, [profileId]);
  await page.goto("/bank/eks-001");
  await expect.poll(() => accountProfile(auth.db, userId)).toBeDefined();
  const id = await accountProfile(auth.db, userId);
  await expect
    .poll(() => recorded("profile_created", (row) => row.profile_id === id))
    .toEqual([expect.objectContaining({ props: { kind: "account" } })]);
});

test("a new account takes over the guest profile", async ({ page, auth }) => {
  const guest = await solveAsGuest(page);
  const { userId, profileId } = await auth.signIn();
  await auth.db.query(`delete from profiles where id = $1`, [profileId]);
  await page.goto("/stats");
  await expect
    .poll(() => recorded("profile_merged", (row) => row.profile_id === guest))
    .toEqual([
      expect.objectContaining({
        props: {
          outcome: "claimed",
          from_profile_id: guest,
          to_profile_id: guest,
          guest_had_progress: true,
          own_had_progress: false,
          guest_age_days: 0,
        },
      }),
    ]);
  expect(await accountProfile(auth.db, userId)).toBe(guest);
});

test("signing in on a task page takes over the guest profile", async ({
  page,
  auth,
}) => {
  const guest = await solveAsGuest(page);
  const aid = await aidOf(page);
  const { userId, profileId } = await auth.signIn();
  await auth.db.query(`delete from profiles where id = $1`, [profileId]);
  await page.goto("/bank/eks-002");
  await expect
    .poll(() => recorded("profile_merged", (row) => row.aid === aid))
    .toEqual([
      expect.objectContaining({
        props: expect.objectContaining({ outcome: "claimed" }),
      }),
    ]);
  expect(await accountProfile(auth.db, userId)).toBe(guest);
  const opened = `select 1 from task_sessions where profile_id = $1 and task_id = 'eks-002'`;
  await expect
    .poll(async () => (await auth.db.query(opened, [guest])).rowCount)
    .toBe(1);
  expect(
    await recorded("profile_created", (row) => row.aid === aid),
  ).toHaveLength(1);
});

test("an account with a profile takes in the guest", async ({ page, auth }) => {
  const guest = await solveAsGuest(page);
  const { profileId } = await auth.signIn();
  await page.goto("/stats");
  await expect
    .poll(() =>
      recorded("profile_merged", (row) => row.profile_id === profileId),
    )
    .toEqual([
      expect.objectContaining({
        props: {
          outcome: "merged",
          from_profile_id: guest,
          to_profile_id: profileId,
          guest_had_progress: true,
          own_had_progress: false,
          guest_age_days: 0,
        },
      }),
    ]);
});

test("the sign-in strip is recorded once per visit to the page", async ({
  page,
}) => {
  await solveAsGuest(page);
  const aid = await aidOf(page);
  const prompts = async () =>
    (
      await Promise.all(
        ["sign_in_prompt_shown", "sign_in_prompt_closed"].map((name) =>
          recorded(name, (row) => row.aid === aid),
        ),
      )
    ).map((rows) => rows.map(({ props }) => props.from));
  const strip = page.getByRole("region", { name: "Sačuvaj napredak" });
  const nav = page.getByRole("banner").getByRole("navigation");

  await page.goto("/stats");
  await expect(strip).toBeVisible();
  await nav.getByRole("link", { name: "Početna" }).click();
  await expect(page).not.toHaveURL(/\/stats$/);
  await page.goBack();
  await expect(strip).toBeVisible();
  await flush(page);
  await expect.poll(prompts).toEqual([["stats"], []]);

  await nav.getByRole("link", { name: "Početna" }).click();
  await page.getByRole("link", { name: "Statistika →" }).click();
  await strip.getByRole("button", { name: "Zatvori" }).click();
  await expect(strip).toHaveCount(0);
  await flush(page);
  await expect.poll(prompts).toEqual([["stats", "stats"], ["stats"]]);
});

test("a Google button records where sign-in started", async ({ page }) => {
  await page.route("**/api/auth/sign-in/social", (route) => route.abort());
  await page.goto("/bank");
  const signInRequest = page.waitForRequest("**/api/auth/sign-in/social");
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Prijavi se" })
    .click();
  await signInRequest;
  const aid = await aidOf(page);
  await expect
    .poll(async () =>
      (await recorded("sign_in_started", (row) => row.aid === aid)).map(
        ({ props }) => props.from,
      ),
    )
    .toEqual(["header"]);
});

test("signing out is recorded with the profile", async ({ page, auth }) => {
  const { profileId } = await auth.signIn();
  await page.goto("/stats");
  await page.getByRole("button", { name: "Nalog" }).click();
  await page.getByRole("menuitem", { name: "Odjavi se" }).click();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Prijavi se" }),
  ).toBeVisible();
  await expect
    .poll(() => recorded("signed_out", (row) => row.profile_id === profileId))
    .toHaveLength(1);
});

test("deleting the account queues its analytics for erasure", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/privacy");
  await page.getByRole("button", { name: "Obriši nalog" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Obriši nalog" })
    .click();
  await expect(page.getByText("Nalog i napredak su obrisani.")).toBeVisible();

  const queued = await auth.db.query(
    `delete from analytics_erasures where profile_id = $1`,
    [profileId],
  );
  expect(queued.rowCount).toBe(1);
  const deleted = () => recorded("account_deleted", () => true);
  await expect.poll(deleted).not.toEqual([]);
  for (const row of await deleted())
    expect(row).toMatchObject({ aid: noId, profile_id: noId });
});
