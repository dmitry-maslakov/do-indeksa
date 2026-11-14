import type { Page } from "@playwright/test";
import { allTasks, allTheories } from "content-collections";
import { expect, test } from "./fixtures";

const exam = "/ftn/p1";

const pages = [
  exam,
  `${exam}/bank`,
  `${exam}/bank/${allTasks[0]?.id}`,
  `${exam}/variants`,
  `${exam}/variants/ftn-p1-2025/solutions`,
  `${exam}/theory`,
  `${exam}/theory/${allTheories[0]?.topic}`,
  `/ru${exam}/stats`,
];

const outside = /^\/(privacy|terms)$/;
const handlers = /\/bank\/(start|similar)\//;

async function linksOf(page: Page) {
  const origin = new URL(page.url()).origin;
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
  return hrefs
    .map((href) => new URL(href))
    .filter((url) => url.origin === origin)
    .map((url) => url.pathname + url.search);
}

const withoutLocale = (path: string) => path.replace(/^\/(ru|en)(?=\/|$)/, "");

for (const path of pages) {
  test(`keeps every link on ${path} inside the exam`, async ({
    page,
    request,
  }) => {
    await page.goto(path);
    const links = [...new Set(await linksOf(page))];
    expect(links.length).toBeGreaterThan(0);
    const leaving = links.filter((link) => {
      const bare = withoutLocale(new URL(link, page.url()).pathname);
      return !(
        bare === exam ||
        bare.startsWith(`${exam}/`) ||
        outside.test(bare)
      );
    });
    expect(leaving).toEqual([]);
    for (const link of links) {
      const res = await request.get(link, { maxRedirects: 0 });
      expect(res.status(), link).toBe(handlers.test(link) ? 307 : 200);
    }
  });
}

test("stays in the exam when moving between tasks", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${exam}/bank/${allTasks[0]?.id}`);
  const rows = page
    .getByRole("complementary", { name: "Preporučeno" })
    .locator("a[data-id]:not([aria-current=page])");
  await rows.first().click();
  await expect(page).toHaveURL(new RegExp(`${exam}/bank/[^/]+$`));
  await page.getByRole("link", { name: "Zadaci" }).first().click();
  await expect(page).toHaveURL(new RegExp(`${exam}/bank`));
});
