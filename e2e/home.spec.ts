import type { Page } from "@playwright/test";
import { at, expect, seedAttempt, test } from "./fixtures";

async function topicCount(page: Page) {
  const all = page
    .locator("#topic-map")
    .getByRole("button", { name: /^Sve · \d+$/ });
  return Number((await all.textContent())?.replace(/\D/g, ""));
}

async function expectFirstVisit(page: Page) {
  await page.goto(at("/"));

  await expect(page.getByText("Predlog za danas")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Kompleksni brojevi" }),
  ).toBeVisible();
  await expect(page.getByText("Kreni odavde.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Počni →" })).toHaveAttribute(
    "href",
    new RegExp(`^${at("/bank/")}(?!start/)[\\w-]+$`),
  );
  await expect(
    page.getByRole("link", { name: "Počni varijantu →" }),
  ).toHaveAttribute("href", new RegExp(`^${at("/variants/")}.+`));
  await expect(page.getByRole("link", { name: "2025" })).toHaveAttribute(
    "href",
    at("/variants/ftn-p1-2025"),
  );
  await expect(page.locator("#topic-map").getByRole("listitem")).toHaveCount(
    await topicCount(page),
  );
}

test("a guest starts with the first topic", ({ page }) =>
  expectFirstVisit(page));

test("a first visit starts with the first topic", async ({ page, auth }) => {
  await auth.signIn();
  await expectFirstVisit(page);
});

test("the home page suggests a topic and maps progress", async ({
  page,
  auth,
}) => {
  const { profileId: id } = await auth.signIn();
  await seedAttempt(auth.db, id, "plan-001", false, 240);
  await seedAttempt(auth.db, id, "fun-002", true, 3);
  await seedAttempt(auth.db, id, "eks-001", false, 1);
  await page.goto(at("/"));

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Eksponencijalne jednačine i nejednačine",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Tema je započeta — vredi je završiti pre sledeće."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Nastavi →" })).toBeVisible();

  const map = page.locator("#topic-map");
  const rows = map.getByRole("listitem");
  const total = await topicCount(page);
  await expect(rows).toHaveCount(total);
  await map.getByRole("button", { name: "Zagrevanje" }).click();
  await expect(rows).toHaveCount(3);
  await expect(
    rows.filter({ hasText: "Eksponencijalne jednačine i nejednačine" }),
  ).toHaveCount(1);
  await expect(rows.filter({ hasText: "%" })).toHaveCount(0);
  await map.getByRole("button", { name: "Nije početo" }).click();
  await expect(rows).toHaveCount(total - 3);
});

test("Počni opens the suggested topic", async ({ page }) => {
  await page.goto(at("/"));
  await page.getByRole("link", { name: "Počni →" }).click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
});

test("the home page doesn't show an unfinished test", async ({ page }) => {
  await page.goto(at("/variants/set-eks-001"));
  await page.getByRole("timer").waitFor();
  await page.goto(at("/"));
  await expect(page.getByText("Predlog za danas")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Nastavi", exact: true }),
  ).toHaveCount(0);
});
