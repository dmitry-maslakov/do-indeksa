import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { answer, expect, finish, test } from "./fixtures";

test("a guest checks an answer", async ({ page }) => {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
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
  await page.getByRole("button", { name: /Eksponencijalne/ }).click();
  const sheet = page.getByRole("dialog", { name: "Zadaci teme" });
  await expect(sheet.getByRole("link", { name: "Svi zadaci" })).toHaveAttribute(
    "href",
    /\/bank\?topic=exponential-equations$/,
  );
  await expect(
    sheet
      .locator('a[href$="/bank/eks-001"]')
      .filter({ hasNotText: "Preporučeno" }),
  ).toBeVisible();
  await sheet.getByLabel("Tema").selectOption("logarithms");
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await page.getByRole("button", { name: /Logaritmi/ }).click();
  await expect(sheet.getByLabel("Tema")).toHaveValue("logarithms");
});

test("a guest finishes the daily test", { tag: "@mobile" }, async ({
  page,
}) => {
  const bar = page.getByRole("navigation", { name: "Glavna navigacija" });
  await page.goto("/daily");
  await expect(page).toHaveURL(/\/variants\/daily-\d{4}-\d{2}-\d{2}$/);
  await expect(
    page.getByText("Nedovršen test ostaje u ovom pregledaču", { exact: false }),
  ).toBeVisible();
  await expect(bar).toBeVisible();
  await page.getByRole("button", { name: "Počni" }).click();
  await page.getByRole("timer").waitFor();
  await expect(bar).toBeHidden();
  await page.reload();
  await page.getByRole("timer").waitFor();
  await expect(bar).toBeHidden();
  await finish(page);
  await expect(page.getByRole("heading", { name: "Rezultat" })).toBeVisible();
  await expect(bar).toBeVisible();
  await expect(
    page.getByText("Ovo je procena, a ne zvaničan rezultat", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Prijavi se" }).last(),
  ).toBeVisible();
});

const composer = (page: Page) =>
  page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Sastavi svoj test" }) });

test("a guest composes a short untimed test without a topic", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/variants");
  const card = composer(page);
  const topic = card.getByRole("button", { name: "Logaritmi" });
  await expect(topic).toHaveAttribute("aria-pressed", "true");
  await topic.click();
  await expect(topic).toHaveAttribute("aria-pressed", "false");
  await card.getByRole("button", { name: "5", exact: true }).click();
  await card.getByRole("button", { name: "Počni →" }).click();
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  await expect(page.getByText(/^5 zadataka/)).toBeVisible();
  await page.getByRole("button", { name: "Podeli" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url(),
  );
  await page.getByRole("switch", { name: "Tajmer" }).click();
  await page.getByRole("button", { name: "Počni" }).click();
  await expect(page.getByText("Proteklo vreme")).toBeVisible();
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

test("a guest is told when a personal mode falls back", async ({ page }) => {
  await page.goto("/variants/compose?mode=weak");
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}\?fallback=weak$/);
  await expect(
    page.getByText("Slabije teme i nerešeni zadaci", { exact: false }),
  ).toBeVisible();
});

test("a guest sees why to sign in before google", async ({ page }) => {
  await page.route("**/api/auth/sign-in/social", (route) => route.abort());
  await page.goto("/bank/eks-001");
  const dialog = page.getByRole("alertdialog");
  const header = page
    .getByRole("banner")
    .getByRole("button", { name: "Prijavi se" });

  await header.click();
  await expect(dialog).toContainText("Nalog nije obavezan");
  await expect(
    dialog.getByText("Prijava je samo preko Google-a", { exact: false }),
  ).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(
    /Prijava je samo preko Google-a/,
  );
  await dialog.getByRole("button", { name: "Ne sada" }).click();
  await expect(dialog).toBeHidden();
  await expect(header).toBeFocused();

  await header.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(header).toBeFocused();

  await page.getByRole("button", { name: "Sačuvaj" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Ne sada" }).click();
  await expect(dialog).toBeHidden();

  await header.click();
  const fromDialog = page.waitForRequest("**/api/auth/sign-in/social");
  await dialog
    .getByRole("button", { name: "Prijavi se preko Google-a" })
    .click();
  await fromDialog;

  await page.goto("/bank/eks-001");
  await header.click();
  await dialog
    .getByRole("link", { name: "Šta čuvamo i kako obrisati nalog" })
    .click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Privatnost" })).toBeVisible();

  const direct = page.waitForRequest("**/api/auth/sign-in/social");
  await page
    .getByRole("main")
    .getByRole("button", { name: "Prijavi se preko Google-a" })
    .click();
  await direct;
  await expect(dialog).toHaveCount(0);
});
