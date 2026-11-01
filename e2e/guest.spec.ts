import { createHash, randomBytes } from "node:crypto";
import type { BrowserContext, Page } from "@playwright/test";
import type { Client } from "pg";
import { answer, expect, finish, seedAttempt, test } from "./fixtures";

async function openSheet(page: Page, topic: RegExp) {
  const sheet = page.getByRole("dialog", { name: "Zadaci teme" });
  await expect(async () => {
    if (!(await sheet.isVisible()))
      await page.getByRole("button", { name: topic }).click();
    await expect(sheet).toBeVisible({ timeout: 1000 });
  }).toPass();
  return sheet;
}

test("a guest checks an answer", async ({ page }) => {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
});

test("a guest finds a solved task in statistics after a reload", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  await page.reload();
  await page.goto("/stats");
  await expect(page.getByText(/^1 od [\d.]+$/)).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Sačuvaj napredak" }),
  ).toContainText("Statistika je samo na ovom uređaju");
});

async function guestProfileId(context: BrowserContext, db: Client) {
  const token = (await context.cookies()).find(
    (c) => c.name === "__Host-profile",
  )?.value;
  const { rows } = await db.query(
    "select id from profiles where token_hash = $1",
    [createHash("sha256").update(String(token)).digest("base64url")],
  );
  return rows[0].id;
}

async function solveFirst(page: Page) {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
}

test("a guest with five solved tasks is offered to save them once a visit", async ({
  page,
  context,
  auth,
}) => {
  const strip = page.getByRole("region", { name: "Sačuvaj napredak" });
  await solveFirst(page);
  await expect(strip).toHaveCount(0);

  const profileId = await guestProfileId(context, auth.db);
  for (const taskId of ["eks-002", "kb-003", "log-001", "trig-001"])
    await seedAttempt(auth.db, profileId, taskId, true);

  await solveFirst(page);
  await expect(strip).toContainText(
    "5 rešenih zadataka je samo na ovom uređaju",
  );
  await strip.getByRole("button", { name: "Zatvori" }).click();
  await expect(strip).toBeHidden();
  await solveFirst(page);
  await expect(strip).toHaveCount(0);

  const next = await context.newPage();
  await solveFirst(next);
  await expect(
    next.getByRole("region", { name: "Sačuvaj napredak" }),
  ).toBeVisible();
});

test("a guest back on another day with five solved tasks gets Google One Tap", async ({
  page,
  context,
  auth,
}) => {
  const prompts: string[] = [];
  await context.route("https://accounts.google.com/gsi/client", (route) => {
    prompts.push(new URL(page.url()).pathname);
    return route.fulfill({
      contentType: "text/javascript",
      body: "window.google = { accounts: { id: { initialize() {}, prompt() {} } } };",
    });
  });
  await solveFirst(page);
  const profileId = await guestProfileId(context, auth.db);
  for (const taskId of ["eks-002", "kb-003", "log-001", "trig-001"])
    await seedAttempt(auth.db, profileId, taskId, true, 30);

  await page.goto("/bank/eks-001");
  await expect(page.getByRole("button", { name: "Proveri" })).toBeVisible();
  await page.goto("/");
  await expect.poll(() => prompts).toEqual(["/"]);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Mapa tema" })).toBeVisible();
  expect(prompts).toEqual(["/"]);
});

const profileCookie = async (context: BrowserContext) =>
  (await context.cookies()).some((c) => c.name === "__Host-profile");

test("a task seen before comes after the ones not seen yet", async ({
  page,
  context,
}) => {
  const start = "/bank/start/exponential-equations";
  await page.goto(start);
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  const seen = page.url();
  await expect.poll(() => profileCookie(context)).toBe(true);
  await page.goto(start);
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  expect(page.url()).not.toBe(seen);
});

test("a skipped task stays in the visit before the current one", async ({
  page,
  context,
}) => {
  await page.goto("/bank/start/exponential-equations");
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  const skipped = new URL(page.url()).pathname;
  await expect.poll(() => profileCookie(context)).toBe(true);
  await page.getByRole("link", { name: "Preskoči" }).click();
  await expect(page).not.toHaveURL(skipped);
  const current = new URL(page.url()).pathname;
  const rail = page
    .getByRole("complementary")
    .locator("a[href^='/bank/']:not(nav a)");
  const order = () =>
    rail.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  await expect.poll(order).toContain(current);
  const links = await order();
  expect(links).toContain(skipped);
  expect(links.indexOf(skipped)).toBeLessThan(links.indexOf(current));
});

test("a task page shown again from history takes its next task from a fresh queue", async ({
  page,
  context,
  auth,
}) => {
  await page.goto("/bank/log-001");
  await page
    .getByRole("complementary")
    .getByLabel("Tema")
    .selectOption({ label: "Eksponencijalne jednačine i nejednačine" });
  await expect(page).toHaveURL(/\/bank\/(?!log-001$)[\w-]+$/);
  const first = new URL(page.url()).pathname;
  const skip = page.getByRole("link", { name: "Preskoči" });
  const next = (await skip.getAttribute("href")) ?? "";
  await skip.click();
  await expect(page).toHaveURL(next);
  const opened = `select 1 from task_sessions where profile_id = $1 and task_id = $2`;
  await expect
    .poll(
      async () =>
        (
          await auth.db.query(opened, [
            await guestProfileId(context, auth.db),
            next.split("/").at(-1),
          ])
        ).rowCount,
    )
    .toBe(1);
  await page.goBack();
  await expect(page).toHaveURL(first);
  await expect(skip.and(page.locator(`[href="${next}"]`))).toHaveCount(0);
});

test("browsing without a task creates no profile", async ({
  page,
  context,
}) => {
  for (const path of ["/", "/bank", "/variants", "/stats"]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
  }
  expect(await profileCookie(context)).toBe(false);
});

test.describe("a crawler", () => {
  test.use({
    userAgent:
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  });

  test("opens a task without getting a profile", async ({ page, context }) => {
    await page.goto("/bank/eks-001");
    await expect(page.getByRole("button", { name: "Proveri" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(await profileCookie(context)).toBe(false);
  });
});

test("a guest opens the solution and moves on", async ({ page }) => {
  await page.goto("/bank/eks-001");
  const skip = page.getByRole("link", { name: "Preskoči" });
  const next = await skip.getAttribute("href");
  expect(next).toMatch(/^\/bank\/[\w-]+$/);
  await page.getByRole("button", { name: "Rešenje" }).click();
  await expect(page.getByRole("heading", { name: "Rešenje" })).toBeVisible();
  await expect(skip).toBeHidden();
  await page.getByRole("link", { name: "Sledeći zadatak" }).click();
  await expect(page).toHaveURL(next ?? "");
});

test("a guest switches topics from the sheet", { tag: "@mobile" }, async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  const sheet = await openSheet(page, /Eksponencijalne/);
  await expect(sheet.getByRole("link", { name: "Svi zadaci" })).toHaveAttribute(
    "href",
    /\/bank\/topic\/exponential-equations$/,
  );
  await expect(
    sheet
      .locator('a[href$="/bank/eks-001"]')
      .filter({ hasNotText: "Preporučeno" }),
  ).toBeVisible();
  await sheet.getByLabel("Tema").selectOption("logarithms");
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await expect(sheet).toBeHidden();
  await openSheet(page, /Logaritmi/);
  await expect(sheet.getByLabel("Tema")).toHaveValue("logarithms");
});

test("the sheet opens with the list already in place", {
  tag: "@mobile",
}, async ({ page }) => {
  await page.goto("/bank/eks-001");
  await page
    .locator("aside a[href^='/bank/']:not(nav a)")
    .first()
    .waitFor({ state: "attached" });
  const sheet = await openSheet(page, /Eksponencijalne/);
  await expect(sheet.locator("[aria-current=page]:not(nav a)")).toBeVisible();
  await expect(sheet.locator("[data-slot=skeleton]")).toHaveCount(0);
});

test("a guest finishes a test", { tag: "@mobile" }, async ({ page }) => {
  const bar = page.getByRole("navigation", { name: "Glavna navigacija" });
  await page.goto("/variants/ftn-p1-2025");
  await page.getByRole("timer").waitFor();
  await expect(bar).toBeHidden();
  await page.reload();
  await page.getByRole("timer").waitFor();
  await expect(bar).toBeHidden();
  await finish(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await expect(bar).toBeVisible();
  await expect(
    page.getByText("Ovo je procena, a ne zvaničan rezultat", { exact: false }),
  ).toBeVisible();
});

const composer = (page: Page) =>
  page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Sastavi svoj test" }) });

test("a guest composes a short test without a topic", async ({ page }) => {
  await page.goto("/variants");
  const card = composer(page);
  const topic = card.getByRole("button", { name: "Logaritmi" });
  await expect(topic).toHaveAttribute("aria-pressed", "true");
  await topic.click();
  await expect(topic).toHaveAttribute("aria-pressed", "false");
  await card.getByRole("button", { name: "5", exact: true }).click();
  await card.getByRole("button", { name: "Počni →" }).click();
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  await expect(page.getByText("Preostalo vreme")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Zadaci" }).getByRole("button"),
  ).toHaveCount(5);
});

test("an old test link opens the test under its short code", async ({
  page,
  auth,
}) => {
  const legacy = randomBytes(12).toString("base64url").slice(0, 16);
  await auth.db.query("insert into sets (code, task_ids) values ($1, $2)", [
    legacy,
    ["kb-003", "log-001"],
  ]);
  try {
    await page.goto(`/v/${legacy}`);
    await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
    const code = page.url().split("/").at(-1) ?? "";
    await expect(page.getByText(`Kod ${code}`)).toBeVisible();
    await page.goto(`/v/${code.toLowerCase()}`);
    await expect(page).toHaveURL(new RegExp(`/v/${code}$`));
  } finally {
    await auth.db.query("delete from sets where code = $1", [legacy]);
  }
});

test("a guest cannot compose a test without topics", async ({ page }) => {
  await page.goto("/variants");
  const card = composer(page);
  const all = card.getByRole("button", { name: "Sve teme" });
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(
    card.getByRole("button", { name: "Samo slabije teme" }),
  ).toHaveCount(0);
  const topics = card.locator("button[title]");
  for (const topic of await topics.all()) await topic.click();
  await expect(card.getByRole("button", { name: "Počni →" })).toBeDisabled();
  await all.click();
  await expect(topics.and(page.locator('[aria-pressed="true"]'))).toHaveCount(
    await topics.count(),
  );
  await expect(card.getByRole("button", { name: "Počni →" })).toBeEnabled();
});

test("a guest signs in straight with google", async ({ page }) => {
  await page.route("**/api/auth/sign-in/social", (route) => route.abort());
  await page.goto("/bank/eks-001");

  const fromHeader = page.waitForRequest("**/api/auth/sign-in/social");
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Prijavi se" })
    .click();
  expect((await fromHeader).postDataJSON().additionalData).toEqual({
    from: "header",
  });
  await expect(page.getByRole("alertdialog")).toHaveCount(0);

  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Politika privatnosti" })
    .click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByRole("heading", { name: "Politika privatnosti" }),
  ).toBeVisible();

  const direct = page.waitForRequest("**/api/auth/sign-in/social");
  await page
    .getByRole("main")
    .getByRole("button", { name: "Prijavi se preko Google-a" })
    .click();
  await direct;
});
