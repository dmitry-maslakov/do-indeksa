import type { Page } from "@playwright/test";
import type { Client } from "pg";
import { answer, expect, finish, test } from "./fixtures";

async function finishSet(page: Page, timed = true) {
  await page.goto("/variants/set-eks-001");
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  if (!timed) await page.getByRole("switch").click();
  await page.getByRole("button", { name: "Počni" }).click();
  await answer(page, "0");
  await finish(page);
}

async function expectAnswers(page: Page, errors: string[]) {
  const row = page.locator("summary").filter({ hasText: "odgovor" });
  await expect(row).toContainText("tačno");
  await row.click();
  await expect(
    page.getByRole("button", { name: "Otvori zadatak" }),
  ).toHaveAttribute("href", /\/bank\/eks-001$/);
  expect(errors).toEqual([]);
}

async function storedRun(db: Client, profileId: string) {
  const { rows } = await db.query(
    "select timed, overtime, durations_ms from runs where profile_id = $1",
    [profileId],
  );
  return rows;
}

test("a guest reviews a finished test and finds it in history", {
  tag: "@responsive",
}, async ({ page, errors }) => {
  await finishSet(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  const review = new URL(page.url()).pathname;
  await expect(
    page.getByText("Ovo je procena, a ne zvaničan rezultat", { exact: false }),
  ).toBeVisible();
  await expectAnswers(page, errors);
  await page.goto("/variants?tab=history");
  await expect(page.locator(`main a[href$="${review}"]`)).toBeVisible();
});

test("a signed-in user reviews a finished test", {
  tag: "@responsive",
}, async ({ page, auth, errors }) => {
  const { profileId } = await auth.signIn();
  await finishSet(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await expectAnswers(page, errors);
  expect(await storedRun(auth.db, profileId)).toEqual([
    { timed: true, overtime: false, durations_ms: [expect.any(Number)] },
  ]);
});

test("an untimed test is stored without a time limit", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await finishSet(page, false);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  expect(await storedRun(auth.db, profileId)).toEqual([
    { timed: false, overtime: null, durations_ms: [expect.any(Number)] },
  ]);
});
