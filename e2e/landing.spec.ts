import { allExams, allTasks, allTopics } from "content-collections";
import { sortBy } from "es-toolkit";
import { expect, test } from "./fixtures";

const open = sortBy(
  allExams.filter((e) => e.open),
  ["order"],
);
const examButtons = (page: import("@playwright/test").Page) =>
  page
    .getByRole("main")
    .getByRole("link")
    .filter({ has: page.locator("[aria-hidden]") });

test("shows the landing to a new visitor", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(examButtons(page)).toHaveCount(open.length);
  await expect(examButtons(page).first()).toHaveAttribute("href", "/ftn/p1");
  await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("link")).toHaveCount(
    open.length + 1,
  );
  await expect(page.getByRole("banner").getByRole("navigation")).toHaveCount(0);
});

test("keeps the years of an exam button on one line", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  for (const path of ["/", "/ru", "/en"]) {
    await page.goto(path);
    const years = examButtons(page)
      .first()
      .getByText(/\d{4}–\d{4}/);
    const lines = await years.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return new Set([...range.getClientRects()].map((r) => r.top)).size;
    });
    expect(lines, path).toBe(1);
  }
});

test("leads the exam button into its exam", async ({ page }) => {
  await page.goto("/");
  await examButtons(page).first().click();
  await expect(page).toHaveURL(/\/ftn\/p1$/);
  await expect(page.getByRole("heading", { name: "Mapa tema" })).toBeVisible();
});

test("leads to the faculty page by programme", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("main").getByRole("link").last();
  await expect(link).toHaveAttribute("href", "/ftn");
  await page.goto("/ru");
  await page.getByRole("main").getByRole("link").last().click();
  await expect(page).toHaveURL(/^[^?]*\/\/[^/]+\/ftn$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("spans the same years as the exam page", async ({ page }) => {
  await page.goto("/");
  const button = examButtons(page).first();
  const href = await button.getAttribute("href");
  const [, first = "", last = ""] =
    /(\d{4})–(\d{4})/.exec(await button.innerText()) ?? [];
  expect(first).not.toBe("");
  await page.goto(`${href}/about`);
  const years = page.locator("#arhiva ul > li");
  await expect(page.locator("#arhiva")).toContainText(`${last}–${first}`);
  await expect(years.first()).toContainText(last);
  await expect(years.last()).toContainText(first);
});

test("shows the sample task of the exam", async ({ page }) => {
  const task = allTasks.find((t) => t._meta.path === open[0]?.sampleTask);
  test.skip(!task, "the first open exam has no sample task");
  const topic = allTopics.find((t) => t.id === task?.topic);
  await page.goto("/");
  const card = page.getByRole("main").locator("article").last();
  await expect(card.locator(".math-text")).toHaveText(/\S/);
  await expect(card).toContainText(topic?.name["sr-Latn"] ?? "");
});

test("keeps the landing after its links are prefetched", async ({ page }) => {
  await page.goto("/");
  await examButtons(page).first().hover();
  await page.waitForLoadState("networkidle");
  const res = await page.request.get("/", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  await page.reload();
  await expect(examButtons(page)).toHaveCount(open.length);
});

test("serves the landing whole from the cache", async ({ request }) => {
  for (const path of ["/", "/ru"]) {
    const headers = (await request.get(path, { maxRedirects: 0 })).headers();
    expect(headers["x-nextjs-postponed"], path).toBeUndefined();
    expect(headers["cache-control"], path).toContain("s-maxage");
  }
});

test("describes the landing for search", async ({ page }) => {
  await page.goto("/");
  const place = (await examButtons(page).first().innerText())
    .split("\n")
    .find((line) => line.includes(" · "));
  const [faculty] = place?.split(" · ") ?? [];
  const years = place?.match(/\d{4}–\d{4}/)?.[0];
  await expect(page).toHaveTitle(
    `Do indeksa — prijemni iz matematike za ${faculty}`,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://doindeksa.rs",
  );
  for (const [lang, href] of [
    ["sr-Latn", "https://doindeksa.rs"],
    ["ru", "https://doindeksa.rs/ru"],
    ["en", "https://doindeksa.rs/en"],
  ] as const)
    await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveAttribute(
      "href",
      href,
    );
  const ld = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "",
  );
  expect(
    ld["@graph"].map((node: { "@type": string }) => node["@type"]),
  ).toEqual(["WebSite", "EducationalOrganization"]);
  expect(years).toBeDefined();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    new RegExp(` ${years} `),
  );
});

test("fits a phone", { tag: "@mobile" }, async ({ page, errors }) => {
  for (const path of ["/", "/ru", "/en"]) {
    await page.goto(path);
    await expect(examButtons(page).first()).toBeVisible();
    for (const width of [390, 375, 360]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
        `${path} ${width}px`,
      ).toBe(0);
    }
  }
  expect(errors).toEqual([]);
});
