import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const figures = async (page: Page, cells: string) =>
  (await page.locator(cells).allInnerTexts()).flatMap(
    (text) => text.match(/—|\d[\d.,]*/g) ?? [],
  );

async function firstProgram(page: Page) {
  await page.goto("/ftn");
  const row = page
    .locator("#registar tr[id]")
    .filter({ has: page.locator("th a") })
    .first();
  test.skip((await row.count()) === 0, "no programme is checked");
  const exam = await row.evaluate((el) => el.closest("section")?.id ?? "");
  const group = page.locator(`[id="${exam}"]`);
  return {
    href: (await row.locator("th a").getAttribute("href")) ?? "",
    numbers: await figures(page, `[id="${await row.getAttribute("id")}"] td`),
    exam,
    rows: await group.locator("tr[id]").count(),
    linked: await group.locator("tr[id] th a").count(),
  };
}

test("shows the numbers of the faculty register on a programme page", async ({
  page,
}) => {
  const program = await firstProgram(page);
  const res = await page.goto(program.href);
  expect(res?.status()).toBe(200);
  expect(res?.headers()["x-nextjs-postponed"]).toBeUndefined();
  expect(res?.headers()["cache-control"]).toContain("s-maxage");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await figures(page, "main table >> nth=0 >> tbody td")).toEqual(
    program.numbers,
  );
  await expect(
    page.getByRole("button", { name: /^Vežbaj za/ }),
  ).toHaveAttribute("href", `/ftn/${program.exam}`);
  const neighbours = page.locator('section[aria-labelledby="h-neighbours"]');
  await expect(neighbours.locator("li")).toHaveCount(program.rows - 1);
  await expect(neighbours.locator("li a")).toHaveCount(program.linked - 1);
});

test("points every in-page link at a part of the page", async ({ page }) => {
  const program = await firstProgram(page);
  await page.goto(program.href);
  const targets = await page
    .locator('main a[href^="#"]')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")?.slice(1) ?? ""),
    );
  expect(targets).toEqual(expect.arrayContaining(["upis"]));
  for (const id of targets)
    await expect(page.locator(`[id="${id}"]`), id).toHaveCount(1);
  await page.goto(`${program.href}#upis`);
  await expect(page.locator("#upis h2")).toBeInViewport();
});

test("fits a phone", { tag: "@responsive" }, async ({ page, errors }) => {
  const program = await firstProgram(page);
  await page.goto(program.href);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
});

test("lists checked programmes in the sitemap and in Serbian only", async ({
  page,
  request,
}) => {
  const { href } = await firstProgram(page);
  const sitemap = await (await request.get("/sitemap/0.xml")).text();
  expect(sitemap).toContain(`<loc>https://doindeksa.rs${href}</loc>`);
  expect(sitemap).not.toContain(`/ru${href}<`);
  const res = await request.get(`/ru${href}`, { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(new URL(res.headers().location ?? "", res.url()).pathname).toBe(href);
});

test("answers 404 for a programme that has no page", async ({
  page,
  request,
}) => {
  await page.goto("/ftn");
  const plain = page
    .locator("#registar tr[id]")
    .filter({ hasNot: page.locator("th a") })
    .first();
  for (const slug of ["nema-smera", await plain.getAttribute("id")]) {
    const res = await request.get(`/ftn/programs/${slug}`);
    expect(res.status(), slug ?? "").toBe(404);
  }
});
