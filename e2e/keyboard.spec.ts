import type { Locator, Page } from "@playwright/test";
import type { MathfieldElement } from "mathlive";
import { expect, test } from "./fixtures";

test.use({ hasTouch: true, isMobile: true });

const keys = (page: Page) =>
  page.locator(".ML__keyboard.is-visible .MLK__layer.is-visible");

const aboveKeyboard = (field: Locator) =>
  field.evaluate(
    (element) =>
      element.getBoundingClientRect().bottom <=
      window.innerHeight - window.mathVirtualKeyboard.boundingRect.height,
  );

test("the math keyboard opens on tap and closes on return", {
  tag: "@mobile",
}, async ({ page }) => {
  await page.goto("/bank/kv-002");
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = page.locator("math-field").last();
  await field.tap();
  await keys(page).locator('[data-keycap-value="2"]').tap();
  await expect
    .poll(() => field.evaluate((element: MathfieldElement) => element.value))
    .toBe("2");
  await expect.poll(() => aboveKeyboard(field)).toBe(true);

  await keys(page).locator('[data-command*="commit"]').tap();
  await expect(keys(page)).toBeHidden();
  await page.getByRole("button", { name: "Proveri" }).tap();
  await expect(page.getByText("Nije tačno")).toBeVisible();
});
