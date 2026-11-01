import type { Locator, Page } from "@playwright/test";
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
  };
};

const tall = (page: Page) => page.setViewportSize({ width: 1280, height: 900 });

const recorded = (page: Page, task: string) =>
  page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      (response.request().postData() ?? "").includes(`"taskId":"${task}"`),
  );

const scrollTop = (list: Locator) => list.evaluate((el) => el.scrollTop);

async function topOf(row: Locator, list: Locator) {
  const [at, within] = await Promise.all([
    row.boundingBox(),
    list.boundingBox(),
  ]);
  return (at?.y ?? 0) - (within?.y ?? 0);
}

async function driftOf(row: Locator, list: Locator, placed: number) {
  const moved = (await topOf(row, list)) - placed;
  const bottom = await list.evaluate(
    (el) => el.scrollTop >= el.scrollHeight - el.clientHeight - 1,
  );
  return moved > 0 && bottom ? 0 : Math.abs(moved);
}

async function settled(page: Page, list: Locator) {
  let last = "";
  await expect
    .poll(
      async () => {
        const now = `${page.url()} ${await scrollTop(list)}`;
        const same = now === last;
        last = now;
        return same;
      },
      { intervals: [250] },
    )
    .toBe(true);
}

async function skip(page: Page) {
  const from = page.url();
  await page.getByRole("link", { name: "Preskoči" }).click();
  await expect(page).not.toHaveURL(from);
}

test("the rail names itself and marks the task the student is on", async ({
  page,
  errors,
}) => {
  await page.goto("/bank/eks-001");
  const { aside, rows, current } = rail(page);

  await expect(aside).toBeVisible();
  await expect(current).toHaveAttribute("data-id", "eks-001");
  await expect(current).toContainText("Sada rešavaš");
  await expect(rows.filter({ hasText: "Eksponencijalne" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a skipped task is named in words", async ({ page }) => {
  const opened = recorded(page, "eks-001");
  await page.goto("/bank/eks-001");
  const { rows } = rail(page);
  await expect(rows.first()).toBeVisible();
  await opened;

  const skipped = recorded(page, "eks-001");
  await skip(page);
  await skipped;
  await page.reload();
  await expect(rows.and(page.locator('[data-id="eks-001"]'))).toContainText(
    "preskočen",
  );
});

test("a right answer is named in words", async ({ page }) => {
  await page.goto("/bank/eks-001");
  const { current, rows } = rail(page);
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(current).toContainText("Sada rešavaš");
  await expect(current).toContainText("tačno");

  await page.getByRole("link", { name: "Sledeći zadatak" }).click();
  await expect(rows.and(page.locator('[data-id="eks-001"]'))).toContainText(
    "tačno",
  );
});

test("a wrong answer is named in words", async ({ page }) => {
  await page.goto("/bank/eks-001");
  const { current, rows } = rail(page);
  await answer(page, "5");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(current).toContainText("netačno");

  await page.getByRole("link", { name: "Dalje" }).click();
  await expect(rows.and(page.locator('[data-id="eks-001"]'))).toContainText(
    "netačno",
  );
});

test("a task whose result was shown says so", async ({ page }) => {
  const opened = recorded(page, "eks-001");
  await page.goto("/bank/eks-001");
  const { rows } = rail(page);
  await opened;

  const revealed = recorded(page, "eks-001");
  await page.getByRole("button", { name: "Rezultat" }).click();
  await revealed;
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

test("the rail shows five upcoming tasks and marks the first", async ({
  page,
}) => {
  bankOnly();
  await page.goto("/bank/start/exponential-equations");
  const { rows, current } = rail(page);
  await expect(current).toBeVisible();

  await expect(rows).toHaveCount(6);
  await expect(rows.filter({ hasText: "Sledeći" })).toHaveCount(1);
  await expect(rows.nth(1)).toContainText("Sledeći");
});

test("the list follows the student and offers a way back once scrolled away", async ({
  page,
}) => {
  bankOnly();
  await tall(page);
  await page.goto("/bank/start/exponential-equations");
  const { current, list, rows } = rail(page);
  await expect(current).toBeVisible();

  for (let i = 0; i < 8; i++) await skip(page);
  await expect(current).toBeInViewport();
  await expect.poll(() => scrollTop(list)).toBeGreaterThan(0);
  await expect.poll(() => rows.count()).toBe(14);
  await settled(page, list);
  const placed = await topOf(current, list);
  await skip(page);
  await expect.poll(() => driftOf(current, list, placed)).toBeLessThan(8);

  const box = await list.boundingBox();
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 200);
  await page.mouse.wheel(0, -3000);
  await expect.poll(() => scrollTop(list)).toBe(0);
  const pill = page.getByRole("button", { name: "Sada rešavaš" });
  await expect(pill).toBeVisible();
  await expect(current).not.toBeInViewport({ ratio: 0.5 });

  await pill.click();
  await expect(current).toBeInViewport();
  await expect(current).toBeFocused();
  await expect(pill).toBeHidden();

  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 200);
  await page.mouse.wheel(0, -3000);
  await settled(page, list);
  await skip(page);
  await expect(current).toBeInViewport({ ratio: 1 });
  await expect(pill).toBeHidden();
});

test("steps taken in quick succession leave the current row where it was", async ({
  page,
}) => {
  bankOnly();
  await tall(page);
  await page.goto("/bank/start/exponential-equations");
  const { current, list, rows } = rail(page);
  await expect(current).toBeVisible();
  for (let i = 0; i < 8; i++) await skip(page);
  await expect.poll(() => rows.count()).toBe(14);
  await settled(page, list);
  const placed = await topOf(current, list);

  for (let i = 0; i < 4; i++) {
    await page.getByRole("link", { name: "Preskoči" }).click();
    await page.waitForTimeout(120);
  }
  await settled(page, list);
  expect(await driftOf(current, list, placed)).toBeLessThan(20);
});

test("a step after going back to an earlier task still follows the current row", async ({
  page,
}) => {
  bankOnly();
  await tall(page);
  await page.goto("/bank/start/exponential-equations");
  const { current, list, rows } = rail(page);
  await expect(current).toBeVisible();
  for (let i = 0; i < 8; i++) await skip(page);
  await expect.poll(() => rows.count()).toBe(14);
  await settled(page, list);

  const earlier = rows.nth(6);
  const id = (await earlier.getAttribute("data-id")) ?? "";
  await earlier.click();
  await expect(current).toHaveAttribute("data-id", id);
  await settled(page, list);

  await skip(page);
  await settled(page, list);
  await expect(current).toBeInViewport();
  await expect(page.getByRole("button", { name: "Sada rešavaš" })).toBeHidden();
});

test("a click on a row brings it to where the open task was", async ({
  page,
}) => {
  bankOnly();
  await tall(page);
  await page.goto("/bank/start/exponential-equations");
  const { current, list, rows } = rail(page);
  await expect(current).toBeVisible();
  for (let i = 0; i < 8; i++) await skip(page);
  await expect.poll(() => rows.count()).toBe(14);
  await settled(page, list);
  const placed = await topOf(current, list);

  const row = rows.nth(7);
  const id = await row.getAttribute("data-id");
  await row.click();
  await expect(page).toHaveURL(new RegExp(`/bank/${id}$`));
  await expect(current).toHaveAttribute("data-id", id ?? "");
  await settled(page, list);
  expect(await driftOf(current, list, placed)).toBeLessThan(8);
});

test("a click on an upcoming row keeps the rows around it steady", async ({
  page,
}) => {
  bankOnly();
  await tall(page);
  await page.goto("/bank/start/exponential-equations");
  const { current, list, rows } = rail(page);
  await expect(current).toBeVisible();
  for (let i = 0; i < 8; i++) await skip(page);
  await expect.poll(() => rows.count()).toBe(14);
  await settled(page, list);

  await list.evaluate((el) => {
    const log = { height: el.scrollHeight, shortest: el.scrollHeight };
    Object.assign(window, { railLog: log });
    const sample = () => {
      log.shortest = Math.min(log.shortest, el.scrollHeight);
      requestAnimationFrame(sample);
    };
    sample();
  });
  const row = rows.nth(10);
  const id = (await row.getAttribute("data-id")) ?? "";
  await row.click();
  await expect(current).toHaveAttribute("data-id", id);
  await settled(page, list);

  const log = await page.evaluate(
    () =>
      (
        window as unknown as {
          railLog: { height: number; shortest: number };
        }
      ).railLog,
  );
  expect(log.shortest).toBeGreaterThanOrEqual(log.height - 3);
});

test("the phone bar says where the student is in the visit", {
  tag: "@mobile",
}, async ({ page }) => {
  const opened = recorded(page, "eks-001");
  await page.goto("/bank/eks-001");
  const bar = page.getByRole("button", { name: /Eksponencijalne/ });
  await expect(bar).toContainText("1. zadatak");
  await opened;

  await skip(page);
  await expect(bar).toContainText("2. zadatak");
  const sheet = page.getByRole("dialog", { name: "Zadaci teme" });
  await expect(async () => {
    if (!(await sheet.isVisible())) await bar.click();
    await expect(sheet).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(sheet.locator("a[data-id][aria-current=page]")).toContainText(
    "Sada rešavaš",
  );
});
