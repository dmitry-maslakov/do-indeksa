import { expect, test } from "./fixtures";

const topic = "Eksponencijalne jednačine i nejednačine";

test("reads a topic and walks through its methods", async ({
  page,
  errors,
}) => {
  await page.goto("/theory");
  await expect(page).toHaveTitle(
    "Teorija za prijemni iz matematike na FTN-u · Do indeksa",
  );
  await page.getByRole("link", { name: topic }).click();

  await expect(page).toHaveURL(/\/theory\/exponential-equations$/);
  await expect(page).toHaveTitle(`${topic}: teorija · Do indeksa`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(topic);
  await expect(
    page.getByText("4. zadatak na prijemnom · 4 teme · 5 metoda"),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Grafici funkcija/ }),
  ).toBeVisible();

  const panel = page.getByRole("complementary", { name: "Teorija" });
  const section = (name: string) =>
    panel.getByRole("link", { name, exact: true });
  await expect(section("Stepen i njegova svojstva")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await section("Nejednačine").click();
  await expect(section("Nejednačine")).toHaveAttribute("aria-current", "page");
  await section("Jednačine").click();
  await expect(page).toHaveURL(/#jednacine$/);
  await expect(section("Jednačine")).toHaveAttribute("aria-current", "page");

  await panel.getByRole("link", { name: "Metodi" }).click();
  await expect(page).toHaveURL(/\/methods\/same-base$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Svođenje na istu osnovu",
  );
  await expect(
    page.getByText("Česta greška").filter({ visible: true }),
  ).toBeVisible();

  await page
    .getByRole("main")
    .getByRole("link", { name: /^Smena/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/methods\/substitution$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Smena/);
  await expect(
    page.getByText("Kad u jednačini vidiš").filter({ visible: true }),
  ).toBeVisible();
  await expect(panel.getByRole("link", { name: /^Smena/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(errors).toEqual([]);
});

test("lists the methods as cards on a phone", { tag: "@mobile" }, async ({
  page,
  errors,
}) => {
  await page.goto("/theory/exponential-equations");
  await expect(page.getByRole("complementary")).toBeHidden();
  await page.getByRole("link", { name: "Metodi · 5" }).click();

  await expect(page).toHaveURL(/\/theory\/exponential-equations\/methods$/);
  await page.getByRole("link", { name: /^Homogene jednačine/ }).click();
  await expect(page).toHaveURL(/\/methods\/homogeneous$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Homogene jednačine",
  );
  await page.getByRole("link", { name: "Metodi", exact: true }).click();
  await expect(page).toHaveURL(/\/theory\/exponential-equations\/methods$/);
  expect(errors).toEqual([]);
});
