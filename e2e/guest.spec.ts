import { expect, test } from "@playwright/test";

test("a guest checks an answer", async ({ page }) => {
  await page.goto("/bank/eks-001");
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = page.locator("math-field").first();
  await field.click();
  await field.pressSequentially("2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
});

test("a guest finishes the daily test", async ({ page }) => {
  await page.goto("/daily");
  await expect(page).toHaveURL(/\/variants\/daily-\d{4}-\d{2}-\d{2}$/);
  await expect(
    page.getByText("Nedovršen test ostaje u ovom pregledaču", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Počni" }).click();
  await page.getByRole("timer").waitFor();
  await page.getByRole("button", { name: "Završi test" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Završi test" })
    .click();
  await expect(page.getByRole("heading", { name: "Rezultat" })).toBeVisible();
  await expect(
    page.getByText("Ovo je procena, a ne zvaničan rezultat", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Prijavi se" }).last(),
  ).toBeVisible();
});

test("a guest sees the answers after a test", async ({ page }) => {
  await page.goto("/variants/set-eks-001");
  await expect(page).toHaveURL(/\/v\/[\w-]{7}$/);
  await page.getByRole("button", { name: "Počni" }).click();
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = page.locator("math-field").first();
  await field.click();
  await field.pressSequentially("0");
  await page.getByRole("button", { name: "Završi test" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Završi test" })
    .click();
  await expect(page.getByRole("heading", { name: "Rezultat" })).toBeVisible();
  await expect(
    page.getByText("Ovo je procena, a ne zvaničan rezultat", { exact: false }),
  ).toBeVisible();
  const row = page.locator("summary").filter({ hasText: "odgovor" });
  await expect(row).toContainText("tačno");
  await row.click();
  await expect(
    page.getByRole("button", { name: "Otvori zadatak" }),
  ).toHaveAttribute("href", /\/bank\/eks-001$/);
});

test("a guest composes an untimed test from a topic", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/variants");
  await page.getByText("Izaberi teme").click();
  await page.getByRole("button", { name: "Logaritmi" }).click();
  await page.getByRole("button", { name: "Sastavi", exact: true }).click();
  await expect(page).toHaveURL(/\/v\/[\w-]{7}$/);
  await page.getByRole("button", { name: "Podeli" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url(),
  );
  await page.getByRole("switch", { name: "Tajmer" }).click();
  await page.getByRole("button", { name: "Počni" }).click();
  await expect(page.getByText("Proteklo vreme")).toBeVisible();
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

  await page.goto("/");
  const direct = page.waitForRequest("**/api/auth/sign-in/social");
  await page.getByRole("button", { name: "Prijavi se preko Google-a" }).click();
  await direct;
  await expect(dialog).toHaveCount(0);
});
