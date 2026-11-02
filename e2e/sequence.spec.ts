import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.skip(
  process.env.CONTENT_DIR === "bank",
  "the sequence part is checked on the public sample tasks",
);

const position = (page: Page, number: number) =>
  page.locator(`math-field[aria-label="Mesto ${number}"]`);

const list = (page: Page) =>
  page.locator("fieldset", { has: position(page, 1) });

const sent = (page: Page) => page.locator("input[name=answer]").nth(4);

const check = (page: Page) =>
  page.getByRole("button", { name: "Proveri" }).click();

async function enter(page: Page, box: Locator, text: string) {
  await expect(async () => {
    await box.click();
    await expect(box).toBeFocused({ timeout: 500 });
  }).toPass();
  await page.keyboard.type(text);
}

const paste = (box: Locator, text: string) =>
  box.evaluate((el, text) => {
    const data = new DataTransfer();
    data.setData("text/plain", text);
    el.shadowRoot?.querySelector(".ML__keyboard-sink")?.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
    );
  }, text);

test.beforeEach(async ({ page }) => {
  await page.goto("/bank/vek-002");
  await page.waitForFunction(() => customElements.get("math-field"));
});

test("an ordered list has a numbered box for each place and is checked by position", async ({
  page,
}) => {
  await expect(list(page).locator("math-field")).toHaveCount(3);
  await expect(list(page).getByText(/^[123]$/)).toHaveText(["1", "2", "3"]);
  await expect(page.getByRole("button", { name: "još jedno" })).toHaveCount(0);

  await enter(page, position(page, 1), "3;");
  await expect(position(page, 2)).toBeFocused();
  await page.keyboard.type("2;1");
  await expect(sent(page)).toHaveValue("3;2;1");
  await check(page);
  await expect(page.getByText("Nije tačno", { exact: true })).toBeVisible();
  await expect(position(page, 1)).toHaveJSProperty("readOnly", false);

  await paste(position(page, 1), "\\sqrt{6}; \\frac{3\\sqrt{3}}{2}; 3");
  await expect(sent(page)).toHaveValue("\\sqrt{6};\\frac{3\\sqrt{3}}{2};3");
  await check(page);
  await expect(page.getByText("Popuni sve delove.")).toBeVisible();
  await expect(position(page, 1)).toHaveJSProperty("readOnly", true);
});

test("the order matters", async ({ page }) => {
  await paste(position(page, 1), "3; \\frac{3\\sqrt{3}}{2}; \\sqrt{6}");
  await expect(sent(page)).toHaveValue("3;\\frac{3\\sqrt{3}}{2};\\sqrt{6}");
  await check(page);
  await expect(page.getByText("Nije tačno", { exact: true })).toBeVisible();
});

test("an empty place is named before the order is checked", async ({
  page,
}) => {
  await enter(page, position(page, 2), "3");
  await check(page);
  await expect(
    page.getByText("Jedno mesto je prazno — popuni sva mesta redom."),
  ).toBeVisible();
});
