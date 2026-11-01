import type { Page } from "@playwright/test";
import { answer, expect, test } from "./fixtures";

const bankOnly = () =>
  test.skip(
    process.env.CONTENT_DIR !== "bank",
    "needs a topic with many tasks",
  );

const rail = (page: Page) => {
  const aside = page.getByRole("complementary", { name: "Preporučeno" });
  return {
    aside,
    rows: aside.locator("a[data-id]"),
    current: aside.locator("a[data-id][aria-current=page]"),
    list: aside.locator("div.overflow-y-auto"),
    summary: aside.getByText(/^\d+ zadat(ak|ka|aka)/),
  };
};

async function skip(page: Page) {
  const link = page.getByRole("link", { name: "Preskoči" });
  const href = (await link.getAttribute("href")) ?? "";
  await link.click();
  await expect(page).toHaveURL(href);
}

test("the rail names itself and marks the task the student is on", async ({
  page,
  errors,
}) => {
  await page.goto("/bank/eks-001");
  const { aside, rows, current, summary } = rail(page);

  await expect(aside).toBeVisible();
  await expect(current).toHaveAttribute("data-id", "eks-001");
  await expect(current).toContainText("Sada rešavaš");
  await expect(summary).toHaveCount(0);
  await expect(rows.filter({ hasText: "Eksponencijalne" })).toHaveCount(0);
  await expect(aside.getByRole("heading", { name: "Na redu" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a skipped task is counted and named in words", async ({ page }) => {
  await page.goto("/bank/eks-001");
  const { rows, summary } = rail(page);
  await expect(rows.first()).toBeVisible();

  await skip(page);
  await expect(summary).toHaveText("1 zadatak");
  await expect(rows.and(page.locator('[data-id="eks-001"]'))).toContainText(
    "preskočen",
  );
});

test("a right answer is counted and named in words", async ({ page }) => {
  await page.goto("/bank/eks-001");
  const { current, rows, summary } = rail(page);
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(current).toContainText("Sada rešavaš");
  await expect(current).toContainText("tačno");
  await expect(summary).toHaveCount(0);

  await page.getByRole("link", { name: "Sledeći zadatak" }).click();
  await expect(summary).toHaveText("1 zadatak · 1 tačno");
  await expect(rows.and(page.locator('[data-id="eks-001"]'))).toContainText(
    "tačno",
  );
});

test("a wrong answer is named in words and not counted as right", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  const { current, rows, summary } = rail(page);
  await answer(page, "5");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(current).toContainText("netačno");

  await page.getByRole("link", { name: "Dalje" }).click();
  await expect(summary).toHaveText("1 zadatak");
  await expect(rows.and(page.locator('[data-id="eks-001"]'))).toContainText(
    "netačno",
  );
});

test("a task whose result was shown says so", async ({ page }) => {
  await page.goto("/bank/eks-001");
  const { rows } = rail(page);
  await page.getByRole("button", { name: "Rezultat" }).click();
  await page.getByRole("link", { name: "Sledeći zadatak" }).click();
  await expect(rows.and(page.locator('[data-id="eks-001"]'))).toContainText(
    "pogledan odgovor",
  );
});

test("Sada rešavaš moves to the task Sledeći zadatak leads to", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  const { aside, rows, current } = rail(page);
  const next = rows.filter({ hasText: "Sledeći" });
  await expect(next).toHaveCount(1);
  const id = (await next.getAttribute("data-id")) ?? "";
  await expect(rows.nth(0)).toHaveAttribute("data-id", "eks-001");
  await expect(rows.nth(1)).toHaveAttribute("data-id", id);

  await skip(page);
  await expect(current).toHaveAttribute("data-id", id);
  await expect(aside.getByText("Sada rešavaš")).toHaveCount(1);
  await expect(current).toContainText("Sada rešavaš");
});

test("the rail shows three upcoming tasks and marks the first", async ({
  page,
}) => {
  bankOnly();
  await page.goto("/bank/start/exponential-equations");
  const { rows, current } = rail(page);
  await expect(current).toBeVisible();

  await expect(rows).toHaveCount(4);
  await expect(rows.filter({ hasText: "Sledeći" })).toHaveCount(1);
  await expect(rows.nth(1)).toContainText("Sledeći");
  await expect(rows.nth(2)).not.toContainText("Sledeći");
  await expect(rows.nth(3)).not.toContainText("Sledeći");
});

test("the list follows the student and offers a way back once scrolled away", async ({
  page,
}) => {
  bankOnly();
  await page.goto("/bank/start/exponential-equations");
  const { current, list, rows } = rail(page);
  await expect(current).toBeVisible();
  const scrolled = () => list.evaluate((el) => el.scrollTop);
  const top = () =>
    current.evaluate(
      (row) =>
        row.getBoundingClientRect().top -
        (row.closest("div.overflow-y-auto")?.getBoundingClientRect().top ?? 0),
    );

  for (let i = 0; i < 8; i++) await skip(page);
  await expect(current).toBeInViewport();
  await expect.poll(scrolled).toBeGreaterThan(0);
  await expect.poll(() => rows.count()).toBe(12);
  await page.waitForTimeout(600);
  const placed = await top();
  await skip(page);
  await expect
    .poll(async () => Math.abs((await top()) - placed))
    .toBeLessThan(3);

  const box = await list.boundingBox();
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 200);
  await page.mouse.wheel(0, -3000);
  await expect.poll(scrolled).toBe(0);
  const pill = page.getByRole("button", { name: "Sada rešavaš" });
  await expect(pill).toBeVisible();
  await expect(current).not.toBeInViewport();

  await skip(page);
  await page.waitForTimeout(600);
  expect(await scrolled()).toBe(0);
  await expect(pill).toBeVisible();

  await pill.click();
  await expect(current).toBeInViewport();
  await expect(pill).toBeHidden();
});

test("a click on a row does not scroll the list", async ({ page }) => {
  bankOnly();
  await page.goto("/bank/start/exponential-equations");
  const { current, list, rows } = rail(page);
  await expect(current).toBeVisible();
  for (let i = 0; i < 8; i++) await skip(page);
  await expect.poll(() => rows.count()).toBe(12);
  await page.waitForTimeout(600);
  const before = await list.evaluate((el) => el.scrollTop);

  const row = rows.nth(6);
  const id = await row.getAttribute("data-id");
  await row.click();
  await expect(page).toHaveURL(new RegExp(`/bank/${id}$`));
  await expect(current).toHaveAttribute("data-id", id ?? "");
  await page.waitForTimeout(600);
  expect(await list.evaluate((el) => el.scrollTop)).toBe(before);
});
