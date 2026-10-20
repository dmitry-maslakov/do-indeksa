import type { Page } from "@playwright/test";
import type { Client } from "pg";
import { expect, test } from "./fixtures";

const attempt = (
  db: Client,
  userId: string,
  taskId: string,
  correct: boolean,
  hoursAgo: number,
) =>
  db.query(
    `insert into attempts (user_id, task_id, answers, parts, correct, duration_ms, created_at)
     values ($1, $2, '{1}', '{true}', $3, 1000, now() - $4::int * interval '1 hour')`,
    [userId, taskId, correct, hoursAgo],
  );

async function expectFirstVisit(page: Page) {
  await page.goto("/");

  await expect(page.getByText("Predlog za danas")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Kompleksni brojevi" }),
  ).toBeVisible();
  await expect(page.getByText("Kreni odavde.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Počni →" })).toHaveAttribute(
    "href",
    "/bank/start/complex-numbers",
  );
  await expect(
    page.getByRole("link", { name: "Počni varijantu →" }),
  ).toHaveAttribute("href", /^\/variants\/.+/);
  await expect(page.getByRole("link", { name: "2025" })).toHaveAttribute(
    "href",
    "/variants/ftn-p1-2025",
  );
  await expect(page.locator("#topic-map").getByRole("listitem")).toHaveCount(
    10,
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
  const id = await auth.signIn();
  await attempt(auth.db, id, "plan-001", false, 240);
  await attempt(auth.db, id, "fun-002", true, 3);
  await attempt(auth.db, id, "eks-001", false, 2);
  await attempt(auth.db, id, "eks-001", false, 1);
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Eksponencijalne jednačine i nejednačine",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Ovde je zapelo — bolje sad, dok je sveže."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Nastavi →" })).toBeVisible();

  const map = page.locator("#topic-map");
  const rows = map.getByRole("listitem");
  await expect(rows).toHaveCount(10);
  await map.getByRole("button", { name: "Ponovi" }).click();
  await expect(rows).toHaveText([/Planimetrija/]);
  await map.getByRole("button", { name: "U toku" }).click();
  await expect(
    rows.filter({ hasText: "Eksponencijalne jednačine i nejednačine" }),
  ).toHaveCount(1);
});

test("Počni opens the suggested topic", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Počni →" }).click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
});
