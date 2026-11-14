import { expect, test } from "./fixtures";

const register = "#registar";

test("lists the programmes of a faculty by exam", async ({ page }) => {
  const res = await page.goto("/ftn");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const groups = page.locator(`${register} section[id]`);
  expect(await groups.count()).toBeGreaterThan(0);
  for (const group of await groups.all()) {
    const label = await group.getAttribute("aria-labelledby");
    await expect(page.locator(`[id="${label}"]`)).toHaveCount(1);
  }
  const ids = await page
    .locator(`${register} tr[id]`)
    .evaluateAll((rows) => rows.map((row) => row.id));
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  await expect(
    page.getByRole("button", { name: /^Vežbaj za/ }).first(),
  ).toHaveAttribute("href", `/ftn/${await groups.first().getAttribute("id")}`);
  await expect(
    page.getByRole("banner").getByRole("button", { name: /jezik/i }),
  ).toHaveCount(0);
});

test("finds a programme and keeps the query in the address", async ({
  page,
}) => {
  await page.goto("/ftn");
  const rows = page.locator(`${register} tbody tr`);
  const first = rows.first();
  const name = (await first.locator("th > *").first().textContent()) ?? "";
  const field = page.getByRole("searchbox", { name: "Nađi smer" });

  await field.fill(name);
  await expect(first).toBeVisible();
  await expect(page.locator("main [aria-live=polite]")).toHaveText(/\d/);
  await expect(page).toHaveURL(/[?&]q=/);
  await page.reload();
  await expect(field).toHaveValue(name);
  await expect(first).toBeVisible();

  await field.fill("qqqq");
  await expect(page.locator("main [aria-live=polite]")).toHaveText(/„qqqq“/);
  await expect(
    page.getByRole("button", { name: "Obriši pretragu" }),
  ).toBeVisible();
  await expect(rows.filter({ visible: true })).toHaveCount(0);
  await field.press("Escape");
  await expect(field).toHaveValue("");
  await expect(page).not.toHaveURL(/[?&]q=/);
  await expect(first).toBeVisible();
});

test("shows the row an address points to below the column head", {
  tag: "@responsive",
}, async ({ page }) => {
  await page.goto("/ftn");
  const id = await page
    .locator(`${register} tr[id]`)
    .first()
    .getAttribute("id");
  await page.goto(`/ftn#${id}`);
  const row = page.locator(`[id="${id}"]`);
  await expect(row).toBeInViewport();
  expect(
    await row.evaluate((el) => {
      const { left, top, width } = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(left + width / 2, top + 2));
    }),
  ).toBe(true);
});

test("answers other locales with the Serbian page", async ({ request }) => {
  for (const path of ["/ru/ftn", "/en/ftn"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(308);
    expect(new URL(res.headers().location ?? "", res.url()).pathname).toBe(
      "/ftn",
    );
  }
});

for (const [from, to] of [
  ["/exams?q=P1", "/ftn?q=P1"],
  ["/faculties/ftn", "/ftn"],
  ["/calculator", "/ftn"],
] as const)
  test(`redirects ${from} to the faculty`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toBe(to);
  });
