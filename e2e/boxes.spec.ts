import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const fields = (page: Page) => page.locator("math-field");

const textOf = (box: Locator) =>
  box.evaluate((el) => (el as HTMLElement & { value: string }).value);

const sent = (page: Page, part = 0) =>
  page.locator("input[name=answer]").nth(part);

async function enter(page: Page, box: Locator, text: string) {
  await expect(async () => {
    await box.click();
    await expect(box).toBeFocused({ timeout: 500 });
  }).toPass();
  await page.keyboard.type(text);
}

const check = (page: Page) =>
  page.getByRole("button", { name: "Proveri" }).click();

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForFunction(() => customElements.get("math-field"));
}

test.describe("a list of values", () => {
  test.beforeEach(async ({ page }) => open(page, "/bank/log-001"));

  test("starts with one box and keeps a comma between digits decimal", async ({
    page,
  }) => {
    await expect(fields(page)).toHaveCount(1);
    await enter(page, fields(page).first(), "1,5");
    await expect(fields(page)).toHaveCount(1);
    await expect(sent(page)).toHaveValue("1{,}5");
  });

  test("opens the next box at a comma and a space, at ; and at the plus", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "1,5, 2");
    await expect(fields(page)).toHaveCount(2);
    await expect(sent(page)).toHaveValue("1{,}5;2");
    await expect(fields(page).nth(1)).toBeFocused();

    await page.keyboard.type(";3");
    await expect(fields(page)).toHaveCount(3);
    await expect(sent(page)).toHaveValue("1{,}5;2;3");

    await page.getByRole("button", { name: "još jedno" }).first().click();
    await expect(fields(page)).toHaveCount(4);
    await expect(fields(page).nth(3)).toBeFocused();
  });

  test("leaves a fraction at a comma instead of trapping the cursor", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "1/2, 3");
    await expect(sent(page)).toHaveValue("\\frac12;3");
    await page.reload();
    await page.waitForFunction(() => customElements.get("math-field"));
    await enter(page, fields(page).first(), "1/2;3");
    await expect(sent(page)).toHaveValue("\\frac12;3");
    await expect(fields(page)).toHaveCount(2);
  });

  test("opens the next box at a comma after a letter, a root or a bracket", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "2pi, 3");
    await expect(sent(page)).toHaveValue("2\\pi;3");
    await expect(fields(page)).toHaveCount(2);
    await page.keyboard.type(", (1+2),4");
    await expect(fields(page)).toHaveCount(4);
    await expect(sent(page)).toHaveValue("2\\pi;3;\\left(1+2\\right);4");
  });

  test("removes an empty box at Backspace and goes back to the one before", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "4;");
    await expect(fields(page)).toHaveCount(2);
    await page.keyboard.press("Backspace");
    await expect(fields(page)).toHaveCount(1);
    await expect(fields(page).first()).toBeFocused();
    await expect(sent(page)).toHaveValue("4");
  });

  test("sends no solution as an empty set and takes it back", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "4");
    await page.getByRole("button", { name: "∅ nema rešenja" }).click();
    await expect(fields(page)).toHaveCount(0);
    await expect(sent(page)).toHaveValue("\\emptyset");
    await page.getByRole("button", { name: "Obriši „nema rešenja“" }).click();
    await expect(fields(page)).toHaveCount(1);
    await expect(sent(page)).toHaveValue("");
  });

  test("checks both roots, the second typed with the root key", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "4;");
    await page.getByRole("button", { name: "√" }).click();
    await page.keyboard.type("2");
    await expect(sent(page)).toHaveValue("4;\\sqrt2");
    await check(page);
    await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
    await expect(fields(page).first()).toHaveAttribute("read-only", "");
  });

  test("checks at Enter from any box", async ({ page }) => {
    await enter(page, fields(page).first(), "4;");
    await page.getByRole("button", { name: "√" }).click();
    await page.keyboard.type("2");
    await fields(page).first().click();
    await expect(fields(page).first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  });

  test("puts the cursor in the last box when the empty part of the frame is clicked", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "4;3");
    await fields(page).first().click();
    const frame = page.locator("[data-field]").first();
    const { width, height } = (await frame.boundingBox()) ?? {
      width: 0,
      height: 0,
    };
    await frame.click({ position: { x: width - 40, y: height / 2 } });
    await expect(fields(page).last()).toBeFocused();
  });

  test("takes the symbol row away once the answer is shown or checked", async ({
    page,
  }) => {
    const tray = page.locator("button", { hasText: "∅ nema rešenja" });
    await expect(tray.locator("xpath=ancestor::*[@inert]")).toHaveCount(0);
    await enter(page, fields(page).first(), "4;");
    await page.getByRole("button", { name: "√" }).click();
    await page.keyboard.type("2");
    await check(page);
    await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
    await expect(tray.locator("xpath=ancestor::*[@inert]")).toHaveCount(1);
    await expect(sent(page)).toHaveValue("4;\\sqrt2");
  });

  test("shows the result in the boxes, read only", async ({ page }) => {
    await page.getByRole("button", { name: "Rezultat" }).click();
    await expect(fields(page)).toHaveCount(2);
    await expect(fields(page).first()).toHaveAttribute("read-only", "");
    await expect(fields(page).last()).toHaveAttribute("read-only", "");
    expect(await textOf(fields(page).first())).toBe("4");
    expect(await textOf(fields(page).last())).toBe("\\sqrt{2}");
  });

  test("marks the box that cannot be read and says why", async ({ page }) => {
    await enter(page, fields(page).first(), "4;");
    await page.getByRole("button", { name: "a/b" }).click();
    await page.keyboard.type("1");
    await check(page);
    const problem = page.getByRole("alert").filter({ hasText: "Razlomak" });
    await expect(problem).toContainText("nije dovršen");
    await expect(fields(page).first()).not.toHaveAttribute("data-invalid");
    await expect(fields(page).nth(1)).toHaveAttribute("data-invalid", "");
    await enter(page, fields(page).nth(1), "2");
    await expect(problem).toBeHidden();
    await expect(fields(page).nth(1)).not.toHaveAttribute("data-invalid");
  });
});

test.describe("an interval", () => {
  test.beforeEach(async ({ page }) => open(page, "/bank/eks-003"));

  test("is typed as on paper into its boxes and checked", async ({ page }) => {
    await enter(page, fields(page).first(), "-");
    await page.getByRole("button", { name: "∞" }).click();
    await page.keyboard.type(";0)U2;+");
    await page.getByRole("button", { name: "∞" }).click();
    await expect(fields(page)).toHaveCount(4);
    await expect(sent(page)).toHaveValue("(-\\infty;0)\\cup(2;+\\infty)");
    await check(page);
    await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  });

  test("splits a pair typed in one go with a bare comma into its two ends", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "[0,2]");
    await expect(fields(page)).toHaveCount(2);
    await expect(sent(page)).toHaveValue("[0;2]");
    await expect(fields(page).last()).toBeFocused();
    await page.keyboard.type("U(3,4)");
    await expect(fields(page)).toHaveCount(4);
    await expect(sent(page)).toHaveValue("[0;2]\\cup(3;4)");
  });

  test("lays out an interval pasted as text", async ({ page }) => {
    await enter(page, fields(page).first(), "1");
    await fields(page)
      .first()
      .evaluate((box) => {
        const data = new DataTransfer();
        data.setData("text/plain", "x\\in(-∞,-1)∪[0,1)");
        box.shadowRoot?.querySelector(".ML__keyboard-sink")?.dispatchEvent(
          new ClipboardEvent("paste", {
            clipboardData: data,
            bubbles: true,
            cancelable: true,
            composed: true,
          }),
        );
      });
    await expect(fields(page)).toHaveCount(4);
    await expect(sent(page)).toHaveValue("(-\\infty;-1)\\cup[0;1)");
  });

  test("changes a bracket by a click and keeps an infinite end round", async ({
    page,
  }) => {
    await enter(page, fields(page).first(), "0;1");
    const left = page.getByRole("button", { name: /Leva zagrada/ });
    const right = page.getByRole("button", { name: /Desna zagrada/ });
    await left.click();
    await expect(left).toHaveAttribute("aria-pressed", "true");
    await right.click();
    await expect(sent(page)).toHaveValue("[0;1]");
    await enter(page, fields(page).first(), "-");
    await page.getByRole("button", { name: "∞" }).click();
    await expect(sent(page)).toHaveValue("(-\\infty;1]");
    await expect(left).toBeDisabled();
  });

  test("adds a piece, an isolated point and no solution", async ({ page }) => {
    await enter(page, fields(page).first(), "0;1");
    await page.getByRole("button", { name: "∪ interval" }).click();
    await expect(fields(page)).toHaveCount(4);
    await expect(fields(page).nth(2)).toBeFocused();
    await page.getByRole("button", { name: "{a} tačka" }).click();
    await expect(fields(page)).toHaveCount(5);
    await page.keyboard.type("7");
    await expect(sent(page)).toHaveValue("(0;1)\\cup(;)\\cup\\{7\\}");
    await page.getByRole("button", { name: "∅", exact: true }).click();
    await expect(sent(page)).toHaveValue("\\emptyset");
  });

  test("says which end of the interval is empty", async ({ page }) => {
    await enter(page, fields(page).first(), "0");
    await check(page);
    await expect(
      page.getByRole("alert").filter({ hasText: "Kraj intervala je prazan" }),
    ).toBeVisible();
    await expect(fields(page).nth(1)).toHaveAttribute("data-invalid", "");
  });

  test("says that a decimal comma swallowed the next end", async ({ page }) => {
    await enter(page, fields(page).first(), "0,5");
    await check(page);
    const problem = page
      .getByRole("alert")
      .filter({ hasText: "Zarez iza cifre je decimalni" });
    await expect(problem).toBeVisible();
    await expect(fields(page).first()).toHaveAttribute("data-invalid", "");
  });

  test("shows the result as an interval in boxes", async ({ page }) => {
    await page.getByRole("button", { name: "Rezultat" }).click();
    await expect(fields(page)).toHaveCount(4);
    const texts = await fields(page).evaluateAll((all) =>
      all.map((el) => (el as HTMLElement & { value: string }).value),
    );
    expect(texts).toEqual(["-\\infty", "0", "2", "+\\infty"]);
    await expect(
      page.getByRole("button", { name: /zagrada/ }).first(),
    ).toBeDisabled();
  });
});

test("a point has as many boxes as its unknowns and moves on at a comma", async ({
  page,
}) => {
  await open(page, "/bank/vek-002");
  await expect(fields(page)).toHaveCount(5);
  await enter(page, fields(page).nth(2), "0;1;2");
  await expect(sent(page, 2)).toHaveValue("(0;1;2)");
  await expect(fields(page)).toHaveCount(5);
  await enter(page, fields(page).first(), "60");
  await enter(page, fields(page).nth(1), "3/2");
  await check(page);
  await expect(
    page.getByRole("status").filter({ hasText: /tačno|Nije/ }),
  ).toBeVisible();
});

test("a task with several parts keeps a field for each", async ({ page }) => {
  await open(page, "/bank/kv-002");
  await expect(fields(page)).toHaveCount(3);
  await enter(page, fields(page).nth(0), "5");
  await enter(page, fields(page).nth(1), "4");
  await enter(page, fields(page).nth(2), "6");
  await check(page);
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
});

test("a test restores the boxes of its draft", async ({ page }) => {
  await open(page, "/variants/ftn-p1-2025");
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  await rail.getByRole("button", { name: /Logaritmi/ }).click();
  await enter(page, fields(page).first(), "1/2;3");
  await page.getByRole("button", { name: "Prethodni" }).click();
  await rail.getByRole("button", { name: /Logaritmi/ }).click();
  await expect(fields(page)).toHaveCount(2);
  await expect(sent(page)).toHaveValue("\\frac12;3");
  await page.reload();
  await page.waitForFunction(() => customElements.get("math-field"));
  await expect(fields(page)).toHaveCount(2);
  await expect(sent(page)).toHaveValue("\\frac12;3");
});

test.describe("on a phone", () => {
  test.use({ hasTouch: true, isMobile: true });

  const keys = (page: Page) =>
    page.locator(".ML__keyboard.is-visible .MLK__layer.is-visible");
  const key = (page: Page, value: string) =>
    keys(page).locator(`[data-keycap-value="${value}"]`).first();
  const cap = (page: Page, label: string) =>
    keys(page).getByText(label, { exact: true }).first();

  async function touch(page: Page, path: string) {
    await open(page, path);
    const first = fields(page).first();
    await expect(async () => {
      await first.tap();
      await expect(keys(page)).toBeVisible({ timeout: 500 });
    }).toPass();
  }

  test("a list of values has its own keyboard with a key for the next box", {
    tag: "@mobile",
  }, async ({ page }) => {
    await touch(page, "/bank/log-001");
    await expect(cap(page, "sledeće ⇥")).toBeVisible();
    await key(page, "4").tap();
    await cap(page, "sledeće ⇥").tap();
    await expect(fields(page)).toHaveCount(2);
    await expect(fields(page).nth(1)).toBeFocused();
    await key(page, "2").tap();
    await expect(sent(page)).toHaveValue("4;2");
    await cap(page, "∅").tap();
    await expect(fields(page)).toHaveCount(0);
    await expect(sent(page)).toHaveValue("\\emptyset");
  });

  test("an interval has the brackets, the infinity and the union on its keyboard", {
    tag: "@mobile",
  }, async ({ page }) => {
    await touch(page, "/bank/eks-003");
    await cap(page, "[").tap();
    await key(page, "1").tap();
    await keys(page).locator('[data-command*="moveToNextChar"]').tap();
    await expect(fields(page).nth(1)).toBeFocused();
    await page.waitForTimeout(150);
    await key(page, "2").tap();
    await cap(page, ")").tap();
    await expect(sent(page)).toHaveValue("[1;2)");
    await cap(page, "∪").tap();
    await expect(fields(page)).toHaveCount(4);
    await expect(fields(page).nth(2)).toBeFocused();
    await cap(page, "∞").tap();
    await expect(sent(page)).toHaveValue("[1;2)\\cup(\\infty;)");
  });

  test("a bracketed pair typed with the decimal comma key lands in two ends", {
    tag: "@mobile",
  }, async ({ page }) => {
    await touch(page, "/bank/eks-003");
    await cap(page, "[").tap();
    await key(page, "0").tap();
    await keys(page).locator('[data-command*="insertDecimalSeparator"]').tap();
    await page.waitForTimeout(150);
    await key(page, "2").tap();
    await cap(page, "]").tap();
    await expect(fields(page)).toHaveCount(2);
    await expect(sent(page)).toHaveValue("[0;2]");
  });

  test("the letters keyboard has the operators and keeps the keys of the kind", {
    tag: "@mobile",
  }, async ({ page }) => {
    await touch(page, "/bank/log-001");
    await cap(page, "abc").tap();
    await expect(cap(page, "q")).toBeVisible();
    await expect(cap(page, "sledeće ⇥")).toBeVisible();
    await expect(key(page, "+")).toBeVisible();
    await expect(key(page, "-")).toBeVisible();
    await cap(page, "xⁿ").tap();
    await expect(cap(page, "123")).toBeVisible();
  });

  test("a single value keeps the plain keyboard", { tag: "@mobile" }, async ({
    page,
  }) => {
    await touch(page, "/bank/eks-001");
    await expect(cap(page, "sledeće ⇥")).toBeHidden();
    await expect(cap(page, "abc")).toBeVisible();
    await key(page, "2").tap();
    await cap(page, "abc").tap();
    await expect(cap(page, "q")).toBeVisible();
    await cap(page, "123").tap();
    await expect(sent(page)).toHaveValue("2");
  });
});
