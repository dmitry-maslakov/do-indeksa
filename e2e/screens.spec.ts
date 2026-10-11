import { expect, test } from "@playwright/test";

test("healthz answers without a redirect", async ({ request }) => {
  const res = await request.get("/api/healthz", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

const screens = [
  [
    "/",
    "Prijemni iz matematike na FTN-u",
    "Do indeksa — prijemni iz matematike za FTN",
  ],
  ["/bank", "Banka zadataka", "Banka zadataka · Do indeksa"],
  [
    "/bank/eks-001",
    "Proveri",
    "Zadatak 4 · Eksponencijalne jednačine i nejednačine · Do indeksa",
  ],
  ["/variants", "Probni testovi", "Probni testovi · Do indeksa"],
  ["/review", "Analiza", "Analiza · Do indeksa"],
  ["/stats", "Statistika", "Statistika · Do indeksa"],
] as const;

for (const [path, text, title] of screens) {
  test(`renders ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByText(text).first()).toBeVisible();
    await expect(page).toHaveTitle(title);
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
