import { expect, test } from "@playwright/test";

test("healthz answers without a redirect", async ({ request }) => {
  const res = await request.get("/api/healthz", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

for (const [from, to] of [
  ["/prep", "/"],
  ["/tasks/x/y", "/"],
  ["/sr-Latn/cabinet", "/"],
  ["/ru/exams/1", "/ru"],
  ["/en/faculties/ftn", "/en"],
] as const) {
  test(`redirects ${from}`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers().location).toBe(to);
  });
}

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
    const headers = (await request.get(path)).headers();
    expect(headers["x-nextjs-postponed"], path).toBeUndefined();
    expect(headers["cache-control"], path).toContain("s-maxage");
  }
});

test("serves robots and sitemap", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const rules = await robots.text();
  expect(rules).toContain("Sitemap: https://doindeksa.rs/sitemap/0.xml");
  expect(rules).toContain("Disallow: /review");
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
  expect(pages).toContain("<loc>https://doindeksa.rs/bank</loc>");
  expect(pages).not.toContain("/bank/eks-001");
  const urls = tasks.join();
  expect(urls).toContain("https://doindeksa.rs/bank/eks-001");
  expect(urls).toContain("https://doindeksa.rs/ru/bank/eks-001");
  expect(urls).not.toContain("<loc>https://doindeksa.rs/bank</loc>");
  expect(sitemaps.join()).not.toContain("/launch");
});

const screens = [
  ["/", "Predlog za danas", "Do indeksa — prijemni iz matematike za FTN"],
  [
    "/bank",
    "Banka zadataka",
    "Zadaci za prijemni iz matematike na FTN-u · Do indeksa",
  ],
  [
    "/bank/eks-001",
    "Proveri",
    "Eksponencijalne jednačine i nejednačine: Rešiti jednačinu · Do indeksa",
  ],
  [
    "/variants",
    "Probni testovi",
    "Probni prijemni iz matematike za FTN · Do indeksa",
  ],
  ["/review", "Analiza", "Analiza · Do indeksa"],
  ["/privacy", "Šta čuvamo", "Politika privatnosti · Do indeksa"],
  ["/terms", "Do indeksa ne garantuje upis", "Uslovi korišćenja · Do indeksa"],
  [
    "/launch",
    "Priprema za prijemni iz matematike",
    "Do indeksa — priprema za prijemni iz matematike za FTN",
  ],
] as const;

for (const [path, text, title] of screens) {
  test(`renders ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByText(text).first()).toBeVisible();
    await expect(page).toHaveTitle(title);
  });
}

const missing = [
  "/bank/unknown",
  "/review/a/b",
  "/theory/nema-teme",
  "/theory/nema-teme/methods",
  "/theory/exponential-equations/methods/nema-metode",
  "/variants/nema-varijante",
  "/variants/set-nema-zadatka",
];

for (const path of missing) {
  test(`titles the not found page at ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page).toHaveTitle("Stranica nije pronađena · Do indeksa");
    await expect(page.getByRole("banner")).toBeVisible();
  });
}

test("keeps missing pages out of search before scripts run", async ({
  request,
}) => {
  for (const path of [
    ...missing,
    "/ru/theory/nema-teme",
    "/en/variants/nema-varijante",
  ]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(404);
    expect(await res.text(), path).toContain(
      '<meta name="robots" content="noindex"/>',
    );
  }
});

test("describes the launch page for search", async ({ page, request }) => {
  await page.goto("/launch");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://doindeksa.rs",
  );
  await expect(page.locator('link[hreflang="ru"]')).toHaveAttribute(
    "href",
    "https://doindeksa.rs/ru",
  );
  const ld = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "",
  );
  expect(
    ld["@graph"].map((node: { "@type": string }) => node["@type"]),
  ).toEqual(["WebSite", "EducationalOrganization"]);
  const image = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  const res = await request.get(new URL(image ?? "").pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
});

test("switches the locale", async ({ page }) => {
  await page.goto("/bank");
  await page.getByRole("button", { name: /jezik/i }).click();
  await page.getByRole("menuitemradio", { name: "Русский" }).click();
  await expect(page).toHaveURL(/\/ru\/bank$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Банк задач",
  );
});

test("switches the locale on the launch page", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/launch");
  await page.getByRole("button", { name: /jezik/i }).click();
  await page.getByRole("menuitemradio", { name: "Русский" }).click();
  await expect(page).toHaveURL(/\/ru\/launch$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Подготовка к вступительному по математике",
  );
});
