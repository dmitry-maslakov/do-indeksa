import { expect, test } from "./fixtures";

const about = "/ftn/p1/about";

const compact = (text: string | null) =>
  (text ?? "").replace(/\s+/g, " ").replace(/ ?· ?/g, "·").trim();

test("describes the exam with the faculty's numbers", async ({ page }) => {
  await page.goto("/ftn");
  const group = page.locator("section#p1");
  const groupHead = page.locator("#h-p1").locator("..");
  const composition = compact(
    await groupHead.locator("p").first().textContent(),
  );
  const programs = await group.locator("tbody tr").count();
  await expect(
    groupHead.getByRole("link", { name: /^O prijemnom/ }),
  ).toHaveAttribute("href", about);

  const res = await page.goto(about);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("main").locator('a[href^="/ftn"]:not([href^="/ftn/"])'),
  ).toHaveCount(3);
  const head = compact(
    await page.getByRole("main").locator("header").textContent(),
  );
  expect(head).toContain(composition);
  const tasks = Number(/\d+/.exec(composition)?.[0]);
  await expect(page.locator("#teme ol > li")).toHaveCount(tasks);
  await expect(page.locator("#smerovi ul > li")).toHaveCount(programs);
  await expect(page.locator("#smerovi")).toContainText(String(programs));
  for (const id of ["teme", "arhiva", "smerovi"])
    await expect(
      page
        .getByRole("navigation", { name: "Na ovoj stranici" })
        .locator(`a[href="#${id}"]`),
    ).toHaveCount(1);
});

test("opens a task of the latest paper and its solution", async ({ page }) => {
  await page.goto(about);
  const task = page.locator("#teme details").first();
  await task.locator("summary").click();
  const link = task.getByRole("link", { name: /rešenje/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/ftn\/p1\/bank\/[\w-]+$/);
  await expect(page.getByRole("main")).toBeVisible();
});

test("links every past paper to its solutions and a timed sitting", async ({
  page,
  request,
}) => {
  await page.goto(about);
  const year = page.locator("#arhiva ul > li").first();
  for (const link of await year.getByRole("link").all()) {
    const href = (await link.getAttribute("href")) ?? "";
    if (!href.startsWith("/")) continue;
    expect(href).toMatch(/^\/ftn\/p1\/variants\//);
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test("links the exam page from the exam home", async ({ page }) => {
  await page.goto("/ftn/p1");
  await page.locator(`a[href="${about}"]`).click();
  await expect(page).toHaveURL(about);
});

test("answers an exam without a page with not found", async ({ request }) => {
  expect((await request.get("/ftn/p3/about")).status()).toBe(404);
});

for (const [from, to] of [
  ["/exams/ftn-p1", about],
  ["/en/exams/ftn-p1", `/en${about}`],
] as const) {
  test(`moves ${from} to the exam page`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers().location).toBe(to);
  });
}

test("translates the chrome and keeps other locales out of search", async ({
  page,
}) => {
  const res = await page.goto(`/ru${about}`);
  expect(res?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("navigation", { name: "На этой странице" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
});
