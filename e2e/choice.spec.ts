import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.skip(
  process.env.CONTENT_DIR === "bank",
  "the choice is checked on the public sample tasks",
);

const question = (page: Page) =>
  page.getByRole("radiogroup", { name: /jednakostraničan/ });

const sent = (page: Page) => page.locator("input[name=answer]").nth(3);

const check = (page: Page) =>
  page.getByRole("button", { name: "Proveri" }).click();

test.beforeEach(async ({ page }) => {
  await page.goto("/bank/vek-002");
  await page.waitForFunction(() => customElements.get("math-field"));
});

test("a yes or no part is answered with a button and checked", async ({
  page,
}) => {
  const group = question(page);
  const yes = group.getByRole("radio", { name: "Da" });
  const no = group.getByRole("radio", { name: "Ne" });
  await expect(yes).not.toBeChecked();
  await expect(no).not.toBeChecked();

  await no.click();
  await expect(no).toBeChecked();
  await expect(sent(page)).toHaveValue("no");
  await check(page);
  await expect(page.getByText("Nije tačno", { exact: true })).toBeVisible();
  await expect(group).not.toHaveAttribute("aria-readonly");

  await yes.click();
  await expect(yes).toBeChecked();
  await expect(no).not.toBeChecked();
  await expect(sent(page)).toHaveValue("yes");
  await check(page);
  await expect(page.getByText("Popuni sve delove.")).toBeVisible();
  await expect(group).toHaveAttribute("aria-readonly", "true");
  await no.click();
  await expect(yes).toBeChecked();
});

test("the options move with the arrow keys", async ({ page }) => {
  const group = question(page);
  await group.getByRole("radio", { name: "Ne" }).click();
  await page.keyboard.press("ArrowLeft");
  await expect(group.getByRole("radio", { name: "Da" })).toBeChecked();
  await expect(group.getByRole("radio", { name: "Da" })).toBeFocused();
  await expect(sent(page)).toHaveValue("yes");
});
