import { answer, at, expect, test } from "./fixtures";

test("the test rail tracks answers and hides the time", async ({ page }) => {
  await page.goto(at("/variants/ftn-p1-2025"));
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

test.describe("without scripts", () => {
  test.use({ javaScriptEnabled: false });

  test("the solutions of an exam are in its HTML", async ({ page }) => {
    await page.goto(at("/variants/ftn-p1-2025/solutions"));
    const solutions = page
      .locator("main section", {
        has: page.getByRole("heading", { name: "Rešenje", exact: true }),
      })
      .locator(".math-text");
    await expect(solutions).toHaveCount(10);
    for (const solution of await solutions.all())
      await expect(solution).not.toBeEmpty();
  });
});

test("the catalog leads to the solutions of an exam and they lead to the test", async ({
  page,
}) => {
  await page.goto(at("/variants"));
  await page
    .getByRole("listitem")
    .filter({ hasText: "2025" })
    .getByRole("link", { name: "Rešenja" })
    .click();
  await expect(page).toHaveURL(/\/variants\/ftn-p1-2025\/solutions$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "FTN prijemni 2025: zadaci sa rešenjima",
  );
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 2 })).toHaveCount(10);
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  const logarithms = rail.getByRole("link", { name: "3 Logaritmi" });
  await logarithms.click();
  await expect(page).toHaveURL(/#task-3$/);
  await expect(logarithms).toHaveAttribute("aria-current", "page");
  await main.getByRole("button", { name: "Reši kao test" }).click();
  await expect(page).toHaveURL(/\/variants\/ftn-p1-2025$/);
});

test("the phone test bar switches tasks", { tag: "@mobile" }, async ({
  page,
}) => {
  await page.goto(at("/variants/ftn-p1-2025"));
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
  await page.goto(at("/variants/set-kb-003.eks-001"));
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  const before = page.url();
  await answer(page, "5");
  await page.getByRole("button", { name: "Sledeći" }).click();
  await page.getByRole("button", { name: "Zameni zadatak 2" }).click();
  await expect(page).not.toHaveURL(before);
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  await expect(rail.getByText("Odgovoreno 1 od 2")).toBeVisible();
  await expect(page.getByText("Zadatak 2 · 6 bodova")).toBeVisible();
  await answer(page, "1");
  await expect(
    page.getByRole("button", { name: "Zameni zadatak 2" }),
  ).toHaveCount(0);
});
