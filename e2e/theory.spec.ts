import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

const topic = "Eksponencijalne jednačine i nejednačine";

const href = async (link: Locator) => (await link.getAttribute("href")) ?? "";

test("reads a topic and walks through its methods", async ({
  page,
  errors,
}) => {
  await page.goto("/theory");
  await expect(page).toHaveTitle(
    "Teorija za prijemni iz matematike na FTN-u · Do indeksa",
  );
  await page.getByRole("main").getByRole("link", { name: topic }).click();

  await expect(page).toHaveURL(/\/theory\/exponential-equations$/);
  await expect(page).toHaveTitle(`${topic}: teorija · Do indeksa`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(topic);
  await expect(
    page.locator('main img[src^="data:image/svg+xml"]').first(),
  ).toBeVisible();

  const panel = page.getByRole("complementary", { name: "Teorija" });
  const sections = panel.locator('a[href*="#"]');
  await expect(sections.first()).toHaveAttribute("aria-current", "page");
  const last = sections.last();
  await last.click();
  const hash = (await href(last)).replace(/^[^#]*/, "");
  await expect(page).toHaveURL(new RegExp(`${hash}$`));
  await expect(last).toHaveAttribute("aria-current", "page");
  await expect(sections.first()).not.toHaveAttribute("aria-current");

  await panel.getByRole("link", { name: "Metodi", exact: true }).click();
  await expect(page).toHaveURL(/\/methods\/[\w-]+$/);
  const methods = panel.locator('a[href*="/methods/"]:not([data-active])');
  await expect(methods.first()).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByText("Česta greška").filter({ visible: true }),
  ).toBeVisible();

  const second = methods.nth(1);
  await second.click();
  await expect(page).toHaveURL(new RegExp(`${await href(second)}$`));
  await expect(second).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByText("Kad u jednačini vidiš").filter({ visible: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("lists the methods as cards on a phone", { tag: "@mobile" }, async ({
  page,
  errors,
}) => {
  await page.goto("/theory/exponential-equations");
  await expect(page.getByRole("complementary")).toBeHidden();
  await page.getByRole("link", { name: /^Metodi · \d+$/ }).click();

  await expect(page).toHaveURL(/\/theory\/exponential-equations\/methods$/);
  await page.getByRole("main").getByRole("listitem").first().click();
  await expect(page).toHaveURL(/\/methods\/[\w-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Metodi", exact: true }).click();
  await expect(page).toHaveURL(/\/theory\/exponential-equations\/methods$/);
  expect(errors).toEqual([]);
});
