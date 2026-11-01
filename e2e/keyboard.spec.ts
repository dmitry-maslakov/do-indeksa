import type { Locator } from "@playwright/test";
import type { MathfieldElement } from "mathlive";
import { expect, mathKeys, test } from "./fixtures";

test.use({ hasTouch: true, isMobile: true });

const gapToBar = (field: Locator) =>
  field.evaluate((element) => {
    const bar = document.querySelector("[data-phone-bar]");
    const top = bar?.getBoundingClientRect().top ?? 0;
    return top - element.getBoundingClientRect().bottom;
  });

test("the math keyboard opens on tap and closes when the answer is checked", {
  tag: "@mobile",
}, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/bank/kv-002");
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = page.locator("math-field").last();
  await page.evaluate(
    (gap) => window.scrollBy(0, 8 - gap),
    await gapToBar(field),
  );
  await expect.poll(() => gapToBar(field)).toBeLessThan(16);

  await field.tap();
  await mathKeys(page).locator('[data-keycap-value="2"]').tap();
  await expect
    .poll(() => field.evaluate((element: MathfieldElement) => element.value))
    .toBe("2");
  await expect.poll(() => gapToBar(field)).toBeGreaterThanOrEqual(0);

  await page.getByRole("button", { name: "Proveri" }).tap();
  await expect(mathKeys(page)).toBeHidden();
  await expect(page.getByText("Nije tačno")).toBeVisible();
});
