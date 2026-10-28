import { answer, expect, test } from "./fixtures";

test("the test rail tracks answers and hides the time", async ({ page }) => {
  await page.goto("/variants/ftn-p1-2025");
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  await expect(rail.getByText("Prijemni 2025")).toBeVisible();
  await answer(page, "2");
  await expect(rail.getByText("Odgovoreno 1 od 10")).toBeVisible();
  await expect(rail.getByRole("button", { name: /^odgovoren/ })).toHaveCount(1);
  await rail.getByRole("button", { name: /Logaritmi/ }).click();
  await expect(
    page.getByText("Zadatak 3 · 6 bodova · Logaritmi"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Prethodni" }).click();
  await expect(rail.getByRole("button", { name: /Kvadratna/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await rail.getByRole("button", { name: "Sakrij" }).click();
  await expect(page.getByRole("timer")).toBeHidden();
  await rail.getByRole("button", { name: "Prikaži" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
});

test("the phone test bar switches tasks", { tag: "@mobile" }, async ({
  page,
}) => {
  await page.goto("/variants/ftn-p1-2025");
  await answer(page, "2");
  await page.getByRole("button", { name: "Sledeći" }).click();
  await expect(page.getByText("Zadatak 2 · 6 bodova")).toBeVisible();
  const first = page.getByRole("button", {
    name: "Zadatak 1, odgovoren",
    exact: true,
  });
  await expect(
    page.getByRole("button", { name: "Zadatak 2, bez odgovora", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await first.click();
  await expect(page.getByText("Zadatak 1 · 6 bodova")).toBeVisible();
  await expect(first).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("banner")).toBeHidden();
});

test("a composed test swaps an unanswered task and keeps the answers", async ({
  page,
}) => {
  await page.goto("/variants/set-kb-003.eks-001");
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  const before = page.url();
  await answer(page, "5");
  await page.getByRole("button", { name: "Sledeći" }).click();
  await page.getByRole("button", { name: "Zameni zadatak 4" }).click();
  await expect(page).not.toHaveURL(before);
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  await expect(rail.getByText("Odgovoreno 1 od 2")).toBeVisible();
  await expect(page.getByText("Zadatak 4 · 6 bodova")).toBeVisible();
  await answer(page, "1");
  await expect(
    page.getByRole("button", { name: "Zameni zadatak 4" }),
  ).toHaveCount(0);
});
