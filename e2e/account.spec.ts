import type { Client } from "pg";
import { expect, test } from "./fixtures";

const day = 24 * 60 * 60 * 1000;

const count = async (db: Client, table: string, column: string, id: string) =>
  (
    await db.query(
      `select count(*)::int as n from ${table} where ${column} = $1`,
      [id],
    )
  ).rows[0].n;

const userExists = async (db: Client, id: string) =>
  (await db.query(`select 1 from "user" where id = $1`, [id])).rowCount;

const favorite = (db: Client, id: string) =>
  db.query(
    `insert into favorites (profile_id, task_id) values ($1, 'eks-001')`,
    [id],
  );

test("a user deletes the account", async ({ page, auth }) => {
  const { userId, profileId } = await auth.signIn();
  await favorite(auth.db, profileId);
  await page.addInitScript(() =>
    localStorage.setItem(
      "do-indeksa-exam",
      JSON.stringify({ state: { runs: { seeded: {} } }, version: 2 }),
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
  expect(await count(auth.db, "favorites", "profile_id", profileId)).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("do-indeksa-exam") ?? "").state.runs,
    ),
  ).toEqual({});
});

test("a stale session signs in again before deleting", async ({
  page,
  auth,
}) => {
  await page.route("**/api/auth/sign-in/social", (route) => route.abort());
  const { userId, profileId } = await auth.signIn(2 * day);
  await favorite(auth.db, profileId);
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
  expect(await count(auth.db, "favorites", "profile_id", profileId)).toBe(1);
});

test("signing out hides the account statistics", async ({ page, auth }) => {
  await auth.signIn();
  await page.goto("/stats");
  await expect(page.getByText("Još nema završenih testova.")).toBeVisible();

  const nav = page.getByRole("banner").getByRole("navigation");
  await nav.getByRole("link", { name: "Početna" }).click();
  await page.getByRole("button", { name: "Nalog" }).click();
  await page.getByRole("menuitem", { name: "Odjavi se" }).click();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Prijavi se" }),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Statistika" }).click();

  await expect(page.getByText("Prijavi se da vidiš statistiku")).toBeVisible();
  await expect(page.getByText("Još nema završenih testova.")).toBeHidden();
});
