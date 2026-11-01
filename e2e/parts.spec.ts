import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.skip(
  process.env.CONTENT_DIR === "bank",
  "the frames are checked on the public sample tasks",
);

const boxes = (page: Page) => page.locator("[data-field]");

const symbols = (box: Locator) => box.locator(".katex-html");

const letters = (box: Locator) => box.locator("b");

test("an interval answer is asked as x ∈", { tag: "@responsive" }, async ({
  page,
}) => {
  await page.goto("/bank/eks-003");
  const box = boxes(page).first();
  await expect(symbols(box)).toHaveText(["x", "∈"]);
});

test("a list of roots sits between braces", { tag: "@responsive" }, async ({
  page,
}) => {
  await page.goto("/bank/log-001");
  await expect(symbols(boxes(page).first())).toHaveText(["x", "∈{", "}"]);
});

test("a single root and a root list of one task are framed by their own kind", {
  tag: "@responsive",
}, async ({ page }) => {
  await page.goto("/bank/trig-001");
  const [roots, root] = await boxes(page).all();
  await expect(symbols(roots as Locator)).toHaveText(["x", "∈{", "}"]);
  await expect(symbols(root as Locator)).toHaveText(["x", "="]);
});

test("Serbian part letters are shown as they are written", {
  tag: "@responsive",
}, async ({ page }) => {
  await page.goto("/bank/komb-002");
  await expect(page.locator("math-field")).toHaveCount(3);
  await expect(letters(boxes(page))).toHaveText(["a)", "b)", "v)"]);
  await page.goto("/bank/vek-002");
  await expect(letters(boxes(page))).toHaveText(["a)", "b)", "v)"]);
  await expect(symbols(boxes(page).last())).toHaveText(["T", "="]);
});

test("the unit stays after the field", { tag: "@responsive" }, async ({
  page,
}) => {
  await page.goto("/bank/plan-001");
  await expect(symbols(boxes(page).first())).toHaveText(["P", "=", "cm2"]);
  await expect(symbols(boxes(page).last())).toHaveText(["r", "=", "cm"]);
});

test("a part without a letter in a test is framed in its field", async ({
  page,
}) => {
  await page.goto("/variants/ftn-p1-2025");
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  await rail.getByRole("button", { name: /Logaritmi/ }).click();
  await expect(symbols(boxes(page).first())).toHaveText(["x", "∈{", "}"]);
  await rail.getByRole("button", { name: /Kombinatorika/ }).click();
  await expect(page.locator("label b")).toHaveText(["a)", "b)", "v)"]);
});

test("the result of a task without an answer text is built from its checks", async ({
  request,
}) => {
  const reveal = await (
    await request.get("/api/tasks/eks-003/reveal?part=answer")
  ).json();
  expect(reveal.values).toEqual(["(-\\infty;0)\\cup(2;+\\infty)"]);
  expect(reveal.html).toContain(">(-\\infty,0)\\cup(2,+\\infty)<");
});
