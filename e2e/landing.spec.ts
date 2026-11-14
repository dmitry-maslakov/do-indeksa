import { allExams } from "content-collections";
import { expect, test } from "./fixtures";

const open = allExams.filter((e) => e.open);
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

test("shows the sample task of the exam", async ({ page }) => {
  const [exam] = open;
  test.skip(!exam?.sampleTask, "the first open exam has no sample task");
  await page.goto("/");
  await expect(page.getByRole("main").locator("article")).toHaveCount(2);
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
  await expect(page).toHaveTitle("Do indeksa — prijemni iz matematike za FTN");
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
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /\d{4}–\d{4}/,
  );
});

test("fits a phone", { tag: "@mobile" }, async ({ page, errors }) => {
  await page.goto("/");
  await expect(examButtons(page).first()).toBeVisible();
  for (const width of [390, 375, 360]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
      `${width}px`,
    ).toBe(0);
  }
  expect(errors).toEqual([]);
});
