import { answer, expect, finish, test } from "./fixtures";

const offline = "Nema internet veze.";

test("checking an answer offline says why it failed", async ({
  page,
  context,
}) => {
  await page.goto("/bank/eks-001");
  await answer(page, "2");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText(offline)).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  await expect(page.getByText(offline)).toBeHidden();
});

test("a hint that fails to load offers a retry", async ({ page, context }) => {
  await page.goto("/bank/eks-001");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Nagoveštaj" }).click();
  await expect(page.getByText(offline)).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("button", { name: "Pokušaj ponovo" }).click();
  await expect(page.getByText(offline)).toBeHidden();
  await expect(page.getByText("kvadrat od", { exact: false })).toBeVisible();
});

test("a result that fails to load keeps the field locked and offers a retry", async ({
  page,
  context,
}) => {
  await page.goto("/bank/eks-001");
  await page.waitForFunction(() => customElements.get("math-field"));
  await context.setOffline(true);
  await page.getByRole("button", { name: "Rezultat" }).click();
  const field = page.locator("math-field").first();
  await expect(field).toHaveJSProperty("readOnly", true);
  await expect(page.getByText(offline)).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("button", { name: "Pokušaj ponovo" }).click();
  await expect(page.getByText(offline)).toBeHidden();
  await expect(field).toHaveJSProperty("value", "2");
});

test("a solution that fails to load shows one error with one retry", async ({
  page,
  context,
}) => {
  await page.goto("/bank/eks-001");
  await page.waitForFunction(() => customElements.get("math-field"));
  await context.setOffline(true);
  await page.getByRole("button", { name: "Rešenje" }).click();
  await expect(page.getByText(offline)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pokušaj ponovo" }),
  ).toHaveCount(1);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Pokušaj ponovo" }).click();
  await expect(page.getByText(offline)).toBeHidden();
  await expect(page.locator("math-field").first()).toHaveJSProperty(
    "value",
    "2",
  );
});

test("finishing a test offline keeps it open", async ({ page, context }) => {
  const submit = page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Završi test" });
  await page.goto("/variants/ftn-p1-2025");
  await page.getByRole("timer").waitFor();
  await context.setOffline(true);
  await finish(page);
  await expect(page.getByText("Test nije predat.")).toBeVisible();
  await context.setOffline(false);
  await submit.click();
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
});
