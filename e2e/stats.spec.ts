import { answer, at, expect, finish, test } from "./fixtures";

test("a fresh guest sees empty statistics without the save strip", {
  tag: "@responsive",
}, async ({ page, errors }) => {
  await page.goto(at("/stats"));
  await expect(
    page.getByRole("heading", { level: 1, name: "Statistika" }),
  ).toBeVisible();
  await expect(
    page.getByText("U ovom periodu nema završenih testova."),
  ).toBeVisible();
  await expect(
    page.getByText("U ovom periodu još nema rešenih zadataka."),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Sačuvaj napredak" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a guest sees a finished test, today's practice and the mistakes", {
  tag: "@responsive",
}, async ({ page, errors }) => {
  await page.goto(at("/bank/eks-001"));
  await answer(page, "3");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Nije tačno", { exact: true })).toBeVisible();

  await page.goto(at("/variants/set-eks-001"));
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  await answer(page, "0");
  await finish(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  const review = new URL(page.url()).pathname;

  await page.goto(at("/stats"));

  const tests = page.getByRole("region", { name: "Testovi" });
  await expect(tests).toContainText("0/6");
  await expect(tests.locator(`a[href$="${review}"]`)).toBeVisible();

  const regularity = page.getByRole("region", { name: "Redovnost" });
  await expect(regularity).toContainText("1 dan zaredom");
  await expect(regularity).toContainText("1 dan vežbanja");

  const mistakes = page.getByRole("region", { name: "Gde grešim" });
  const row = mistakes
    .getByRole("row")
    .filter({ hasText: "Eksponencijalne jednačine i nejednačine" });
  await expect(row.getByRole("cell").nth(0)).toHaveText("1");
  await expect(row.getByRole("cell").nth(1)).toHaveText("1");
  await expect(row.getByRole("link")).toHaveAttribute(
    "href",
    /\/bank\/start\/exponential-equations$/,
  );

  await expect(
    page.getByRole("region", { name: "Sačuvaj napredak" }),
  ).toContainText("Statistika je samo na ovom uređaju");
  expect(errors).toEqual([]);
});

test("a signed-in student opens statistics from the account menu", async ({
  page,
  auth,
  errors,
}) => {
  await auth.signIn();
  await page.goto("/");
  await page.getByRole("button", { name: "Nalog" }).click();
  await page.getByRole("menuitem", { name: "Statistika" }).click();
  await expect(page).toHaveURL(/\/stats$/);
  await expect(
    page.getByRole("region", { name: "Sačuvaj napredak" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
