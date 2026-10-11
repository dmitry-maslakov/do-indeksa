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

test("serves robots and sitemap", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const rules = await robots.text();
  expect(rules).toContain("Sitemap: https://doindeksa.rs/sitemap.xml");
  expect(rules).toContain("Disallow: /review");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const urls = await sitemap.text();
  expect(urls).toContain("https://doindeksa.rs/bank/eks-001");
  expect(urls).toContain("https://doindeksa.rs/ru/bank/eks-001");
});

const screens = [
  [
    "/",
    "Prijemni iz matematike na FTN-u",
    "Do indeksa — prijemni iz matematike za FTN",
  ],
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
  ["/stats", "Statistika", "Statistika · Do indeksa"],
  ["/privacy", "Šta čuvamo", "Privatnost · Do indeksa"],
] as const;

for (const [path, text, title] of screens) {
  test(`renders ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByText(text).first()).toBeVisible();
    await expect(page).toHaveTitle(title);
  });
}

for (const path of ["/bank/unknown", "/review/a/b"]) {
  test(`titles the not found page at ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page).toHaveTitle("Stranica nije pronađena · Do indeksa");
  });
}

test("switches the locale", async ({ page }) => {
  await page.goto("/bank");
  await page.getByRole("button", { name: /jezik/i }).click();
  await page.getByRole("menuitemradio", { name: "Русский" }).click();
  await expect(page).toHaveURL(/\/ru\/bank$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Банк задач",
  );
});
