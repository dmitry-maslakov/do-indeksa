import { expect, test } from "@playwright/test";
import { at } from "./fixtures";

test("healthz answers without a redirect", async ({ request }) => {
  const res = await request.get("/api/healthz", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("serves pages with nothing personal whole from the cache", async ({
  request,
}) => {
  for (const path of [
    "/terms",
    "/privacy",
    "/theory",
    "/ru/theory/exponential-equations",
    "/theory/exponential-equations/methods",
  ]) {
    const headers = (await request.get(at(path))).headers();
    expect(headers["x-nextjs-postponed"], path).toBeUndefined();
    expect(headers["cache-control"], path).toContain("s-maxage");
  }
});

test("serves robots and sitemap", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const rules = await robots.text();
  expect(rules).toContain("Sitemap: https://doindeksa.rs/sitemap/0.xml");
  expect(rules).toContain("Disallow: /*/review");
  const parts = [...rules.matchAll(/^Sitemap: (.+)$/gm)].map(
    ([, href]) => new URL(href as string).pathname,
  );
  expect(parts.length).toBeGreaterThan(1);
  const sitemaps: string[] = [];
  for (const part of parts) {
    const sitemap = await request.get(part);
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml.match(/<loc>/g)?.length).toBeLessThanOrEqual(50_000);
    sitemaps.push(xml);
  }
  const [pages = "", ...tasks] = sitemaps;
  expect(pages).toContain("<loc>https://doindeksa.rs/ftn/p1/bank</loc>");
  expect(pages).toContain("<loc>https://doindeksa.rs/ru/ftn/p1/bank</loc>");
  expect(pages).toContain(
    "<loc>https://doindeksa.rs/ftn/p1/theory/exponential-equations</loc>",
  );
  expect(pages).not.toContain("/ru/ftn/p1/theory/exponential-equations");
  expect(pages).toContain(
    "<loc>https://doindeksa.rs/ftn/p1/variants/ftn-p1-2025/solutions</loc>",
  );
  expect(pages).not.toContain("/ru/variants/ftn-p1-2025/solutions");
  expect(pages).not.toContain("/bank/eks-001");
  const urls = tasks.join();
  expect(urls).toContain("https://doindeksa.rs/ftn/p1/bank/eks-001");
  expect(urls).not.toContain("/ru/ftn/p1/bank/eks-001");
  expect(urls).not.toContain("<loc>https://doindeksa.rs/ftn/p1/bank</loc>");
  expect(sitemaps.join()).not.toContain("/launch");
});

const screens = [
  ["/", "Predlog za danas", "FTN P1: priprema za prijemni iz matematike"],
  [
    "/bank",
    "Banka zadataka",
    "Zadaci za prijemni iz matematike na FTN-u · Do indeksa",
  ],
  [
    "/bank/eks-001",
    "Proveri",
    "Eksponencijalne jednačine i nejednačine, zadatak 1: Rešiti… · Do indeksa",
  ],
  [
    "/variants",
    "Probni testovi",
    "Probni prijemni iz matematike za FTN · Do indeksa",
  ],
  [
    "/variants/ftn-p1-2025/solutions",
    "Reši kao test",
    "FTN prijemni 2025: zadaci sa rešenjima · Do indeksa",
  ],
  ["/review", "Analiza", "Analiza · Do indeksa"],
  ["/stats", "Statistika", "Statistika · Do indeksa"],
  ["/privacy", "Šta čuvamo", "Politika privatnosti · Do indeksa"],
  ["/terms", "Do indeksa ne garantuje upis", "Uslovi korišćenja · Do indeksa"],
] as const;

for (const [path, text, title] of screens) {
  test(`renders ${path}`, async ({ page }) => {
    const res = await page.goto(at(path));
    expect(res?.status()).toBe(200);
    await expect(page.getByText(text).first()).toBeVisible();
    await expect(page).toHaveTitle(title);
  });
}

test("names each bank page in its main heading", async ({ page }) => {
  const heading = page.getByRole("heading", { level: 1 });
  await page.goto(at("/bank/topic/exponential-equations"));
  await expect(heading).toHaveText("Eksponencijalne jednačine i nejednačine");
  await page.goto(at("/bank/eks-001"));
  await expect(heading).toHaveText(
    "Eksponencijalne jednačine i nejednačine, zadatak 1: Rešiti jednačinu",
  );
});

const missing = [
  "/bank/unknown",
  "/review/a/b",
  "/theory/nema-teme",
  "/theory/nema-teme/methods",
  "/theory/exponential-equations/methods/nema-metode",
  "/variants/nema-varijante",
  "/variants/set-nema-zadatka",
  "/variants/nema-varijante/solutions",
  "/bank/topic/logarithms/1",
  "/bank/topic/logarithms/999",
  "/exams/ftn-p3",
  "/faculties/ftn",
];

for (const path of missing) {
  test(`titles the not found page at ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page).toHaveTitle("Stranica nije pronađena · Do indeksa");
    await expect(page.getByRole("banner")).toBeVisible();
  });
}

test("keeps other locales of Serbian content out of search", async ({
  request,
}) => {
  const noindex = '<meta name="robots" content="noindex"/>';
  for (const path of [
    "/ru/bank/eks-001",
    "/en/theory/exponential-equations",
    "/ru/theory/exponential-equations/methods",
    "/en/variants/ftn-p1-2025/solutions",
  ]) {
    expect(await (await request.get(at(path))).text(), path).toContain(noindex);
  }
  for (const path of [
    "/bank/eks-001",
    "/theory/exponential-equations",
    "/variants/ftn-p1-2025/solutions",
    "/ru/bank",
  ]) {
    expect(await (await request.get(at(path))).text(), path).not.toContain(
      noindex,
    );
  }
});

test("keeps missing pages out of search before scripts run", async ({
  request,
}) => {
  for (const path of [
    ...missing,
    "/ru/theory/nema-teme",
    "/en/variants/nema-varijante",
    "/ru/exams/ftn-p7",
  ]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(404);
    expect(await res.text(), path).toContain(
      '<meta name="robots" content="noindex"/>',
    );
  }
});

test("shares every page with the site image", async ({ page, request }) => {
  for (const [path, locale] of [
    ["/", "sr-Latn"],
    ["/bank/eks-001", "sr-Latn"],
    ["/ru/theory", "ru"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    const image = new URL(
      (await page
        .locator('meta[property="og:image"]')
        .getAttribute("content")) ?? "",
    ).pathname;
    expect(image, path).toBe(`/${locale}/opengraph-image`);
    const res = await request.get(image);
    expect(res.headers()["content-type"], path).toBe("image/png");
  }
});

test("switches the locale", async ({ page }) => {
  await page.goto(at("/bank"));
  await page.getByRole("button", { name: /jezik/i }).click();
  await page.getByRole("menuitemradio", { name: "Русский" }).click();
  await expect(page).toHaveURL(new RegExp(`/ru${at("/bank")}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Банк задач",
  );
});
