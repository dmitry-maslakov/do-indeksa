import type { Locator, Page } from "@playwright/test";
import type { MathfieldElement } from "mathlive";
import { at, expect, mathKeys, test } from "./fixtures";

test.use({ hasTouch: true, isMobile: true });

const gapToBar = (field: Locator) =>
  field.evaluate((element) => {
    const bar = document.querySelector("[data-phone-bar]");
    const top = bar?.getBoundingClientRect().top ?? 0;
    return top - element.getBoundingClientRect().bottom;
  });

async function swipeDown(page: Page, from: Locator) {
  const box = await from.boundingBox();
  const x = (box?.x ?? 0) + 12;
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", at?: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: at === undefined ? [] : [{ x, y: at }],
    });
  await touch("touchStart", y);
  for (let step = 1; step <= 10; step++)
    await touch("touchMove", y + step * 15);
  await touch("touchEnd");
}

test("the math keyboard opens on tap and closes when the answer is checked", {
  tag: "@mobile",
}, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(at("/bank/kv-002"));
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

test("a swipe that starts on the answer field scrolls instead of opening it", {
  tag: "@mobile",
}, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(at("/bank/kv-002"));
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = page.locator("math-field").last();
  await page.evaluate(
    (gap) => window.scrollBy(0, 8 - gap),
    await gapToBar(field),
  );
  const before = await page.evaluate(() => window.scrollY);

  await swipeDown(page, field);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThan(before);
  await expect(mathKeys(page)).toBeHidden();
  expect(
    await field.evaluate((element) => element === document.activeElement),
  ).toBe(false);

  await field.tap();
  await expect(mathKeys(page)).toBeVisible();
});
