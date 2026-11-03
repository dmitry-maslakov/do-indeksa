import type { Page } from "@playwright/test";
import type { Client } from "pg";
import { secondMs } from "../src/lib/dates";
import { answer, expect, finish, test } from "./fixtures";

async function finishSet(page: Page) {
  await page.goto("/variants/set-eks-001");
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  await answer(page, "0");
  await finish(page);
}

const shownTask = (page: Page) => page.getByRole("article");

async function expectAnswers(page: Page, errors: string[]) {
  await expect(page.getByText("od 6 bodova")).toBeVisible();
  const task = shownTask(page);
  await expect(task).toContainText("Eksponencijalne");
  await expect(task).toContainText("0 od 6");
  const cells = task.getByRole("table", { name: "Odgovori" }).getByRole("cell");
  await expect(cells.nth(0)).toContainText("0");
  await expect(cells.nth(1)).toContainText("2");
  await expect(
    task.getByRole("link", { name: "Otvori u banci" }),
  ).toHaveAttribute("href", /\/bank\/eks-001$/);
  expect(errors).toEqual([]);
}

async function storedTest(db: Client, profileId: string) {
  const { rows } = await db.query(
    `select t.overtime, count(s.id)::int as visits
     from test_sessions t join task_sessions s on s.test_session_id = t.id
     where t.profile_id = $1 group by t.id`,
    [profileId],
  );
  return rows;
}

test("a guest reviews a finished test and finds it in history", {
  tag: "@responsive",
}, async ({ page, context, errors }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await finishSet(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  const review = new URL(page.url()).pathname;
  await page.getByRole("button", { name: "Podeli" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    /\/v\/[2-9A-HJKMNP-Z]{5}\?utm_source=share&utm_medium=variant$/,
  );
  await page.getByText("Ovo je procena — kako bodujemo?").click();
  await expect(
    page.getByText("ovo je procena, a ne zvaničan rezultat", { exact: false }),
  ).toBeVisible();
  await expectAnswers(page, errors);
  await page.goto("/variants?tab=history");
  await expect(page.locator(`main a[href$="${review}"]`)).toBeVisible();
});

test("finishing a test right after an answer sends no late draft save", async ({
  page,
  errors,
}) => {
  const conflicts: string[] = [];
  page.on("response", (response) => {
    const request = response.request();
    if (request.method() === "POST" && response.status() === 409)
      conflicts.push(request.url());
  });
  await finishSet(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await page.waitForTimeout(2 * secondMs);
  await page.waitForLoadState("networkidle");
  expect(conflicts).toEqual([]);
  expect(errors).toEqual([]);
});

test("a guest is offered to save a test result", {
  tag: "@responsive",
}, async ({ page, errors }) => {
  await finishSet(page);
  const strip = page.getByRole("region", { name: "Sačuvaj napredak" });
  await expect(strip).toContainText("Rezultat testa je samo na ovom uređaju");
  await page.route("**/api/auth/sign-in/social", (route) =>
    route.fulfill({ json: { redirect: false } }),
  );
  const signIn = page.waitForRequest("**/api/auth/sign-in/social");
  await strip.getByRole("button", { name: "Sačuvaj" }).click();
  expect((await signIn).postDataJSON()).toMatchObject({
    additionalData: { from: "result" },
  });
  await strip.getByRole("button", { name: "Zatvori" }).click();
  await expect(strip).toBeHidden();
  expect(errors).toEqual([]);
});

test("a solution viewed in the review leaves the task open in the bank", async ({
  page,
  errors,
}) => {
  await finishSet(page);
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      (response.request().postData() ?? "").includes('"taskId":"eks-001"'),
  );
  await shownTask(page).getByRole("button", { name: "Rešenje" }).click();
  await saved;

  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a signed-in user reviews a finished test", {
  tag: "@responsive",
}, async ({ page, auth, errors }) => {
  const { profileId } = await auth.signIn();
  await finishSet(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await expectAnswers(page, errors);
  await expect(
    page.getByRole("region", { name: "Sačuvaj napredak" }),
  ).toHaveCount(0);
  expect(await storedTest(auth.db, profileId)).toEqual([
    { overtime: false, visits: 1 },
  ]);
});

test("a test starts again right after it is finished", async ({
  page,
  errors,
}) => {
  await finishSet(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await page.getByRole("button", { name: "Reši ponovo" }).click();
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  const field = page.locator("math-field").first();
  await expect(field).toBeVisible();
  expect(
    await field.evaluate((el) => (el as HTMLElement & { value: string }).value),
  ).toBe("");
  expect(errors).toEqual([]);
});

test("an unfinished test continues from the server on another device", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/variants/set-eks-001");
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  const test = page.url();
  await answer(page, "7");
  await expect
    .poll(async () => {
      const { rows } = await auth.db.query<{ draft: { answers: string[][] } }>(
        "select draft from test_sessions where profile_id = $1 and finished_at is null",
        [profileId],
      );
      return rows[0]?.draft.answers;
    })
    .toEqual([["7"]]);

  await page.evaluate(() => localStorage.clear());
  await page.goto(test);
  await expect
    .poll(() =>
      page
        .locator("math-field")
        .first()
        .evaluate((el) => (el as HTMLElement & { value: string }).value),
    )
    .toBe("7");
});
