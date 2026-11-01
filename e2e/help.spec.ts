import type { Locator, Page } from "@playwright/test";
import { answer, expect, test } from "./fixtures";

const chip = (page: Page, name: string | RegExp) =>
  page.getByRole("button", { name });

const hints = /^Nagoveštaj/;

const status = (page: Page) => page.locator("form > [role=status]");

const fields = (page: Page) => page.locator("math-field");

const box = (field: Locator) => field.locator("..");

async function typeInto(page: Page, index: number, value: string) {
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = fields(page).nth(index);
  await field.click();
  await field.pressSequentially(value);
}

async function clear(page: Page, index: number) {
  await fields(page).nth(index).click();
  await page.keyboard.press("Backspace");
}

async function expectLocked(page: Page) {
  await expect(chip(page, "Proveri")).toBeHidden();
  await expect(page.getByRole("link", { name: "Preskoči" })).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Sledeći zadatak" }),
  ).toBeVisible();
}

test("the help chips go from the weakest to the strongest", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await expect(chip(page, "Nagoveštaj 1/2")).toBeVisible();
  await expect(chip(page, "Rezultat")).toBeVisible();
  await expect(chip(page, "Rešenje")).toBeVisible();
  const order = await page
    .locator("button")
    .filter({ hasText: /^(Nagoveštaj|Rezultat|Rešenje)/ })
    .allInnerTexts();
  expect(order.map((text) => text.split(/\s/)[0])).toEqual([
    "Nagoveštaj",
    "Rezultat",
    "Rešenje",
  ]);
});

test("hints are numbered and the cards keep the order they were opened in", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await chip(page, "Nagoveštaj 1/2").click();
  await expect(
    page.getByRole("heading", { name: "Nagoveštaj 1 od 2" }),
  ).toBeVisible();
  await expect(chip(page, "Nagoveštaj 2/2")).toBeVisible();
  await chip(page, "Nagoveštaj 2/2").click();
  await expect(
    page.getByRole("heading", { name: "Nagoveštaj 2 od 2" }),
  ).toBeVisible();
  await expect(chip(page, hints)).toBeHidden();
  await expect(chip(page, "Rezultat")).toBeVisible();
  await expect(fields(page).first()).toHaveJSProperty("readOnly", false);
  await chip(page, "Rešenje").click();
  await expect(
    page.locator("article").getByRole("heading", { level: 2 }),
  ).toHaveText(["Nagoveštaj 1 od 2", "Nagoveštaj 2 od 2", "Rešenje"]);
});

test("Rezultat puts the answer into the field and locks it", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await answer(page, "3");
  await chip(page, "Rezultat").click();
  const field = fields(page).first();
  await expect(field).toHaveJSProperty("value", "2");
  await expect(field).toHaveJSProperty("readOnly", true);
  await expect(box(field)).toHaveClass(/bg-data-tint/);
  await expect(status(page)).toHaveText("Prikazan rezultat");
  await expectLocked(page);
  await expect(page.getByRole("heading", { name: "Rezultat" })).toHaveCount(0);
  await expect(chip(page, hints)).toBeHidden();
  await expect(chip(page, "Rezultat")).toBeHidden();
  await expect(chip(page, "Rešenje")).toBeVisible();
});

test("Rešenje puts the answer into the field and opens the solution", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await chip(page, "Nagoveštaj 1/2").click();
  await chip(page, "Rešenje").click();
  const field = fields(page).first();
  await expect(field).toHaveJSProperty("value", "2");
  await expect(field).toHaveJSProperty("readOnly", true);
  await expect(box(field)).toHaveClass(/bg-data-tint/);
  await expect(status(page)).toHaveText("Rešenje otvoreno");
  await expect(page.getByRole("heading", { name: "Rešenje" })).toBeVisible();
  await expectLocked(page);
  await expect(chip(page, hints)).toBeHidden();
  await expect(chip(page, "Rezultat")).toBeHidden();
  await expect(chip(page, "Rešenje")).toBeHidden();
});

test("Rešenje after Rezultat opens the solution without a second answer block", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await chip(page, "Rezultat").click();
  await chip(page, "Rešenje").click();
  await expect(page.getByRole("heading", { name: "Rešenje" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rezultat" })).toHaveCount(0);
  await expect(status(page)).toHaveText("Rešenje otvoreno");
  await expect(fields(page).first()).toHaveJSProperty("value", "2");
});

test("after a correct answer only Rešenje stays and keeps the field green", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await chip(page, "Proveri").click();
  const field = fields(page).first();
  await expect(status(page)).toHaveText("Tačno");
  await expect(field).toHaveJSProperty("readOnly", true);
  await expectLocked(page);
  await expect(chip(page, hints)).toBeHidden();
  await expect(chip(page, "Rezultat")).toBeHidden();

  await chip(page, "Rešenje").click();
  await expect(page.getByRole("heading", { name: "Rešenje" })).toBeVisible();
  await expect(status(page)).toHaveText(/^Tačno\s*Rešenje otvoreno$/);
  await expect(box(field)).toHaveClass(/bg-success-tint/);
  await expect(field).toHaveJSProperty("value", "2");
});

test("a correct answer after a hint is labelled uz nagoveštaj", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await chip(page, "Nagoveštaj 1/2").click();
  await answer(page, "2");
  await chip(page, "Proveri").click();
  await expect(status(page)).toHaveText(/^Tačno\s*uz nagoveštaj$/);
  await expect(chip(page, hints)).toBeHidden();
});

test("a part solved alone locks at once while the others stay open", async ({
  page,
}) => {
  await page.goto("/bank/kv-002");
  await typeInto(page, 0, "5");
  await typeInto(page, 1, "1");
  await chip(page, "Proveri").click();
  await expect(status(page)).toContainText("1 od 3 tačno");
  await expect(fields(page).nth(0)).toHaveJSProperty("readOnly", true);
  await expect(box(fields(page).nth(0))).toHaveClass(/bg-success-tint/);
  await expect(fields(page).nth(1)).toHaveJSProperty("readOnly", false);
  await expect(box(fields(page).nth(1))).toHaveClass(/bg-error-tint/);
  await expect(chip(page, "Proveri")).toBeVisible();
  await expect(chip(page, hints)).toBeVisible();

  await clear(page, 1);
  await typeInto(page, 1, "4");
  await typeInto(page, 2, "6");
  await expect(box(fields(page).nth(0))).toHaveClass(/bg-success-tint/);
  await chip(page, "Proveri").click();
  await expect(status(page)).toHaveText("Tačno");
  for (const index of [0, 1, 2])
    await expect(fields(page).nth(index)).toHaveJSProperty("readOnly", true);
  await expectLocked(page);
});

test("Rezultat in a task with parts keeps the parts solved alone", async ({
  page,
}) => {
  await page.goto("/bank/kv-002");
  await typeInto(page, 0, "5");
  await typeInto(page, 1, "1");
  await chip(page, "Proveri").click();
  await expect(status(page)).toContainText("1 od 3 tačno");
  await chip(page, "Rezultat").click();
  await expect(status(page)).toHaveText("Prikazan rezultat1 od 3 tvoje");
  const expected = ["5", "4", "6"];
  for (const [index, value] of expected.entries()) {
    await expect(fields(page).nth(index)).toHaveJSProperty("value", value);
    await expect(fields(page).nth(index)).toHaveJSProperty("readOnly", true);
  }
  await expect(box(fields(page).nth(0))).toHaveClass(/bg-success-tint/);
  await expect(box(fields(page).nth(1))).toHaveClass(/bg-data-tint/);
  await expect(box(fields(page).nth(2))).toHaveClass(/bg-data-tint/);
  await expectLocked(page);
  await expect(chip(page, hints)).toBeHidden();
  await expect(chip(page, "Rešenje")).toBeVisible();
});

test("the help ladder fits a phone", { tag: "@mobile" }, async ({ page }) => {
  await page.goto("/bank/eks-001");
  await chip(page, "Rezultat").click();
  await expect(fields(page).first()).toHaveJSProperty("value", "2");
  await expect(status(page)).toHaveText("Prikazan rezultat");
  await expect(page.getByRole("link", { name: "Sledeći" })).toBeVisible();
  await expect(chip(page, "Rešenje")).toBeVisible();
  const width = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  expect(width).toBeLessThanOrEqual(0);
});
