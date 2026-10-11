import { createHmac, randomUUID } from "node:crypto";
import { type BrowserContext, expect, test } from "@playwright/test";
import { Client } from "pg";

const { DATABASE_URL, BETTER_AUTH_SECRET = "" } = process.env;
const day = 24 * 60 * 60 * 1000;

test.skip(!DATABASE_URL || !BETTER_AUTH_SECRET, "needs the database");

const db = new Client({ connectionString: DATABASE_URL });
let userId: string;

test.beforeAll(() => db.connect());
test.afterAll(() => db.end());
test.afterEach(() => db.query(`delete from "user" where id = $1`, [userId]));

async function signIn(context: BrowserContext, age: number) {
  userId = randomUUID();
  const token = randomUUID();
  await db.query(
    `insert into "user" (id, name, email) values ($1, 'Test', $1 || '@example.test')`,
    [userId],
  );
  await db.query(
    `insert into session (id, token, user_id, created_at, updated_at, expires_at)
     values ($1, $2, $3, $4, now(), now() + interval '1 day')`,
    [randomUUID(), token, userId, new Date(Date.now() - age)],
  );
  await db.query(
    `insert into favorites (user_id, task_id) values ($1, 'eks-001')`,
    [userId],
  );
  const signature = createHmac("sha256", BETTER_AUTH_SECRET)
    .update(token)
    .digest("base64");
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: encodeURIComponent(`${token}.${signature}`),
      url: test.info().project.use.baseURL,
    },
  ]);
}

const count = async (table: string) =>
  (
    await db.query(
      `select count(*)::int as n from ${table} where user_id = $1`,
      [userId],
    )
  ).rows[0].n;

const userExists = async () =>
  (await db.query(`select 1 from "user" where id = $1`, [userId])).rowCount;

test("a user deletes the account", async ({ page, context }) => {
  await signIn(context, 0);
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
  expect(await userExists()).toBe(0);
  expect(await count("session")).toBe(0);
  expect(await count("favorites")).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("do-indeksa-exam") ?? "").state.runs,
    ),
  ).toEqual({});
});

test("a stale session signs in again before deleting", async ({
  page,
  context,
}) => {
  await page.route("**/api/auth/sign-in/social", (route) => route.abort());
  await signIn(context, 2 * day);
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
  expect(await userExists()).toBe(1);
  expect(await count("favorites")).toBe(1);
});

test("signing out hides the account statistics", async ({ page, context }) => {
  await signIn(context, 0);
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
