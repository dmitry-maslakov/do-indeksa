import type { Page } from "@playwright/test";
import { answer, expect, finish, test } from "./fixtures";

async function finishSet(page: Page) {
  await page.goto("/variants/set-eks-001");
  await expect(page).toHaveURL(/\/v\/[\w-]{7}$/);
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

test("a guest reviews a finished test", { tag: "@responsive" }, async ({
  page,
  errors,
}) => {
  await finishSet(page);
  await expect(page.getByRole("heading", { name: "Rezultat" })).toBeVisible();
  await expect(
    page.getByText("Ovo je procena, a ne zvaničan rezultat", { exact: false }),
  ).toBeVisible();
  await expectAnswers(page, errors);
});

test("a signed-in user reviews a finished test", {
  tag: "@responsive",
}, async ({ page, auth, errors }) => {
  await auth.signIn();
  await finishSet(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await expectAnswers(page, errors);
});
