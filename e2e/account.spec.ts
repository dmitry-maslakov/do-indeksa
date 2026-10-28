import type { Page } from "@playwright/test";
import type { Client } from "pg";
import { dayMs } from "../src/lib/dates";
import { answer, expect, seedAttempt, test } from "./fixtures";

const count = async (db: Client, table: string, column: string, id: string) =>
  (
    await db.query(
      `select count(*)::int as n from ${table} where ${column} = $1`,
      [id],
    )
  ).rows[0].n;

const userExists = async (db: Client, id: string) =>
  (await db.query(`select 1 from "user" where id = $1`, [id])).rowCount;

test("a user deletes the account", async ({ page, auth }) => {
  const { userId, profileId } = await auth.signIn();
  await seedAttempt(auth.db, profileId, "eks-001", true);
  await page.addInitScript(() =>
    localStorage.setItem(
      "do-indeksa-exam",
      JSON.stringify({ state: { tests: { seeded: {} } }, version: 4 }),
    ),
  );
  await page.goto("/privacy");
  await page.getByRole("button", { name: "Obriši nalog" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Obriši nalog" })
    .click();

  await expect(page.getByText("Nalog i napredak su obrisani.")).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Prijavi se" }),
  ).toBeVisible();
  expect(await userExists(auth.db, userId)).toBe(0);
  expect(await count(auth.db, "session", "user_id", userId)).toBe(0);
  expect(await count(auth.db, "profiles", "id", profileId)).toBe(0);
  expect(await count(auth.db, "attempts", "profile_id", profileId)).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("do-indeksa-exam") ?? "").state.tests,
    ),
  ).toEqual({});
});

test("a stale session signs in again before deleting", async ({
  page,
  auth,
}) => {
  await page.route("**/api/auth/sign-in/social", (route) => route.abort());
  const { userId, profileId } = await auth.signIn(2 * dayMs);
  await seedAttempt(auth.db, profileId, "eks-001", true);
  await page.goto("/privacy");
  await page.getByRole("button", { name: "Obriši nalog" }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "Obriši nalog" }).click();

  await expect(dialog).toContainText("prvo se ponovo prijavi");
  const signInRequest = page.waitForRequest("**/api/auth/sign-in/social");
  await dialog
    .getByRole("button", { name: "Prijavi se preko Google-a" })
    .click();
  await signInRequest;
  expect(await userExists(auth.db, userId)).toBe(1);
  expect(await count(auth.db, "attempts", "profile_id", profileId)).toBe(1);
});

test("signing out hides the account statistics", async ({ page, auth }) => {
  const { profileId } = await auth.signIn();
  await seedAttempt(auth.db, profileId, "eks-001", true);
  await page.goto("/stats");
  await expect(page.getByText(/^1 od [\d.]+$/)).toBeVisible();
  const strip = page.getByRole("region", { name: "Sačuvaj napredak" });
  await expect(strip).toHaveCount(0);

  const nav = page.getByRole("banner").getByRole("navigation");
  await nav.getByRole("link", { name: "Početna" }).click();
  await page.getByRole("button", { name: "Nalog" }).click();
  await page.getByRole("menuitem", { name: "Odjavi se" }).click();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Prijavi se" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Statistika →" }).click();

  await expect(page.getByText(/^0 od [\d.]+$/)).toBeVisible();
  await expect(strip).toHaveCount(0);
});

const solveAsGuest = async (page: Page) => {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
};

const hasGuestCookie = async (page: Page) =>
  (await page.context().cookies()).some((c) => c.name === "__Host-profile");

test("signing in keeps what a guest solved", async ({ page, auth }) => {
  await solveAsGuest(page);
  await auth.signIn();
  await page.goto("/stats");
  await expect(page.getByText(/^1 od [\d.]+$/)).toBeVisible();
  await expect.poll(() => hasGuestCookie(page)).toBe(false);
  await expect(page.getByText("spojen sa nalogom")).toHaveCount(0);
});

test("signing in to an account with history merges both", async ({
  page,
  auth,
}) => {
  await solveAsGuest(page);
  const { profileId } = await auth.signIn();
  await seedAttempt(auth.db, profileId, "fun-002", true);
  await page.goto("/stats");
  await expect(
    page.getByText("Napredak sa ovog uređaja je spojen sa nalogom."),
  ).toBeVisible();
  await expect(page.getByText(/^2 od [\d.]+$/)).toBeVisible();
  expect(await hasGuestCookie(page)).toBe(false);
});
