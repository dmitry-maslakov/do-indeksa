import type { Page } from "@playwright/test";
import type { Client } from "pg";
import {
  answer,
  expect,
  finish,
  flush,
  needsRecorder,
  noId,
  propsOf,
  type Row,
  recorded,
  rows,
  test,
} from "./fixtures";

needsRecorder();

const named = (name: string, match: (row: Row) => boolean) =>
  rows((row) => row.name === name && match(row));

const accountProfile = async (db: Client, userId: string) =>
  (await db.query(`select id from profiles where user_id = $1`, [userId]))
    .rows[0]?.id;

async function solveAsGuest(page: Page) {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  const created = () => recorded(page, "profile_created");
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
    .poll(() => named("profile_created", (row) => row.profile_id === id))
    .toEqual([expect.objectContaining({ props: { kind: "account" } })]);
});

test("a new account takes over the guest profile", async ({ page, auth }) => {
  const guest = await solveAsGuest(page);
  const { userId, profileId } = await auth.signIn();
  await auth.db.query(`delete from profiles where id = $1`, [profileId]);
  await page.goto("/bank");
  await expect
    .poll(() => named("profile_merged", (row) => row.profile_id === guest))
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
  const { userId, profileId } = await auth.signIn();
  await auth.db.query(`delete from profiles where id = $1`, [profileId]);
  await page.goto("/bank/eks-002");
  await expect
    .poll(() => recorded(page, "profile_merged"))
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
  expect(await recorded(page, "profile_created")).toHaveLength(1);
});

test("an account with a profile takes in the guest", async ({ page, auth }) => {
  const guest = await solveAsGuest(page);
  const { profileId } = await auth.signIn();
  await page.goto("/bank");
  await expect
    .poll(() => named("profile_merged", (row) => row.profile_id === profileId))
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
  await page.goto("/variants/set-eks-001");
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  await answer(page, "0");
  await finish(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  const review = new URL(page.url()).pathname;
  const prompts = async () =>
    (
      await Promise.all(
        ["sign_in_prompt_shown", "sign_in_prompt_closed"].map((name) =>
          propsOf(page, name),
        ),
      )
    ).map((events) => events.map(({ from }) => from));
  const strip = page.getByRole("region", { name: "Sačuvaj napredak" });
  const nav = page.getByRole("banner").getByRole("navigation");

  await expect(strip).toBeVisible();
  await nav.getByRole("link", { name: "Početna" }).click();
  await expect(page).not.toHaveURL(/\/review\//);
  await page.goBack();
  await expect(strip).toBeVisible();
  await flush(page);
  await expect.poll(prompts).toEqual([["result"], []]);

  await page.goto("/variants?tab=history");
  await page.locator(`main a[href$="${review}"]`).click();
  await strip.getByRole("button", { name: "Zatvori" }).click();
  await expect(strip).toHaveCount(0);
  await flush(page);
  await expect.poll(prompts).toEqual([["result", "result"], ["result"]]);
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
  await expect
    .poll(async () =>
      (await propsOf(page, "sign_in_started")).map(({ from }) => from),
    )
    .toEqual(["header"]);
});

test("signing out is recorded with the profile", async ({ page, auth }) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank");
  await page.getByRole("button", { name: "Nalog" }).click();
  await page.getByRole("menuitem", { name: "Odjavi se" }).click();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Prijavi se" }),
  ).toBeVisible();
  await expect
    .poll(() => named("signed_out", (row) => row.profile_id === profileId))
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
  const deleted = () => named("account_deleted", () => true);
  await expect.poll(deleted).not.toEqual([]);
  for (const row of await deleted())
    expect(row).toMatchObject({ aid: noId, profile_id: noId });
});
