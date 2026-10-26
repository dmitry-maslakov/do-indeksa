import { answer, expect, test } from "./fixtures";

test("the test rail tracks answers and hides the time", async ({ page }) => {
  await page.goto("/variants/ftn-p1-2025");
  await page.getByRole("button", { name: "Počni" }).click();
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  await expect(rail.getByText("Prijemni 2025")).toBeVisible();
  await answer(page, "2");
  await expect(rail.getByText("Odgovoreno 1 od 10")).toBeVisible();
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
  await page.getByRole("button", { name: "Počni" }).click();
  await answer(page, "2");
  await page.getByRole("button", { name: "Sledeći" }).click();
  await expect(page.getByText("Zadatak 2 · 6 bodova")).toBeVisible();
  await page.getByRole("button", { name: "Zadatak 1", exact: true }).click();
  await expect(page.getByText("Zadatak 1 · 6 bodova")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zadatak 1", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("banner")).toBeHidden();
});
