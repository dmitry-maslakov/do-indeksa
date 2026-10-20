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

test("finishing a test offline keeps it open", async ({ page, context }) => {
  const submit = page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Završi test" });
  await page.goto("/daily");
  await page.getByRole("button", { name: "Počni" }).click();
  await page.getByRole("timer").waitFor();
  await context.setOffline(true);
  await finish(page);
  await expect(page.getByText("Test nije predat.")).toBeVisible();
  await context.setOffline(false);
  await submit.click();
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
});
