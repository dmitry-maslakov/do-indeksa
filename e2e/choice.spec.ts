import type { Page } from "@playwright/test";
import { at, expect, finish, test } from "./fixtures";

test.skip(
  process.env.CONTENT_DIR === "bank",
  "options are checked on the public sample tasks",
);

const option = (page: Page, role: "radio" | "checkbox", letter: string) =>
  page.getByRole(role, { name: new RegExp(`^${letter}`) });

const sent = (page: Page) =>
  page
    .locator("input[name=answer]")
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );

const check = (page: Page) =>
  page.getByRole("button", { name: "Proveri" }).click();

test("one option is picked by click or letter and checked with Enter", async ({
  page,
  errors,
}) => {
  await page.goto(at("/bank/log-002"));
  const group = page.getByRole("radiogroup", { name: "Odgovor" });
  await expect(group).toHaveAccessibleDescription("Jedan odgovor je tačan.");

  await option(page, "radio", "B").click();
  expect(await sent(page)).toEqual(["B"]);
  await check(page);
  await expect(page.getByText("Nije tačno", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Izaberi drugi odgovor i proveri ponovo."),
  ).toBeVisible();

  await page.keyboard.press("a");
  await expect(option(page, "radio", "A")).toBeChecked();
  await expect(option(page, "radio", "A")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  await expect(group).toHaveAttribute("aria-readonly", "true");
  expect(errors).toEqual([]);
});

test("several options are marked and the marks are counted", async ({
  page,
}) => {
  await page.goto(at("/bank/fun-003"));
  const group = page.getByRole("group", { name: "Odgovor" });
  await expect(group).toHaveAccessibleDescription(
    "Tačnih odgovora može biti više. Označi sve tačne.",
  );

  for (const letter of ["A", "C", "D"])
    await option(page, "checkbox", letter).click();
  expect(await sent(page)).toEqual(["A", "", "C", "D", ""]);
  await check(page);
  await expect(
    page.getByText("Označeno tačnih: 2 od 3, netačnih: 1."),
  ).toBeVisible();

  await page.keyboard.press("c");
  await page.keyboard.press("b");
  await expect(option(page, "checkbox", "C")).not.toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
});

test("a test scores options in proportion and shows them in the review", async ({
  page,
}) => {
  await page.goto(at("/variants/set-log-002.fun-003"));
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  await option(page, "radio", "A").click();
  await page.getByRole("button", { name: "Sledeći zadatak" }).click();
  for (const letter of ["a", "b", "d", "e"]) await page.keyboard.press(letter);
  await expect(option(page, "checkbox", "E")).toBeChecked();
  await finish(page);

  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await expect(page.getByText("10,8")).toBeVisible();
  await page.getByRole("button", { name: /Analiza funkcije/ }).click();
  const task = page.getByRole("article");
  await expect(task).toContainText("4,8 od 6");
  await expect(task.getByText("označeno, netačno")).toBeVisible();
  await expect(task.getByText("označeno, tačno")).toHaveCount(3);
});
