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
  await page.getByRole("button", { name: "Počni" }).click();
  await page.getByRole("timer").waitFor();
  await page.getByRole("button", { name: "Završi test" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Završi test" })
    .click();
  await expect(page.getByRole("heading", { name: "Rezultat" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Prijavi se" }).last(),
  ).toBeVisible();
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
