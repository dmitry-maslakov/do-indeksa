import type { Locator, Page } from "@playwright/test";
import type { Client } from "pg";
import { answer, expect, seedAttempt, seedReveal, test } from "./fixtures";

const chip = (page: Page, name: string | RegExp) =>
  page.getByRole("button", { name });

const hints = /^Nagoveštaj/;

const status = (page: Page) => page.locator("form > [role=status]");

const fields = (page: Page) => page.locator("math-field");

const box = (field: Locator) => field.locator("..");

const recorded = async (
  db: Client,
  table: "attempts" | "reveals",
  profileId: string,
  taskId: string,
) =>
  (
    await db.query(
      `select count(*)::int as n from ${table} where profile_id = $1 and task_id = $2`,
      [profileId, taskId],
    )
  ).rows[0].n;

async function typeInto(page: Page, index: number, value: string) {
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = fields(page).nth(index);
  await field.click();
  await field.pressSequentially(value);
}

async function expectLocked(page: Page) {
  await expect(chip(page, "Proveri")).toBeHidden();
  await expect(page.getByRole("link", { name: "Preskoči" })).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Sledeći zadatak" }),
  ).toBeVisible();
}

test("Rezultat keeps the field locked and filled after a reload", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/eks-001");
  await answer(page, "3");
  await chip(page, "Rezultat").click();
  await expect(status(page)).toHaveText("Prikazan rezultat");
  await expect
    .poll(() => recorded(auth.db, "reveals", profileId, "eks-001"))
    .toBe(1);

  await page.reload();
  const field = fields(page).first();
  await expect(field).toHaveJSProperty("value", "2");
  await expect(field).toHaveJSProperty("readOnly", true);
  await expect(box(field)).toHaveClass(/bg-data-tint/);
  await expect(status(page)).toHaveText("Prikazan rezultat");
  await expectLocked(page);
  await expect(chip(page, hints)).toBeHidden();
  await expect(chip(page, "Rezultat")).toBeHidden();
  await expect(chip(page, "Rešenje")).toBeVisible();
});

test("the solution keeps its card, the hints and the lock after a reload", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/eks-001");
  await chip(page, "Nagoveštaj 1/2").click();
  await chip(page, "Rešenje").click();
  await expect(status(page)).toHaveText("Rešenje otvoreno");
  await expect
    .poll(() => recorded(auth.db, "reveals", profileId, "eks-001"))
    .toBe(2);

  await page.reload();
  const field = fields(page).first();
  await expect(field).toHaveJSProperty("value", "2");
  await expect(field).toHaveJSProperty("readOnly", true);
  await expect(box(field)).toHaveClass(/bg-data-tint/);
  await expect(status(page)).toHaveText("Rešenje otvoreno");
  await expect(
    page.locator("article").getByRole("heading", { level: 2 }),
  ).toHaveText(["Nagoveštaj 1 od 2", "Rešenje"]);
  await expectLocked(page);
  await expect(chip(page, hints)).toBeHidden();
  await expect(chip(page, "Rešenje")).toBeHidden();
});

test("a hint opened alone is still open after a reload", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/eks-001");
  await chip(page, "Nagoveštaj 1/2").click();
  await expect
    .poll(() => recorded(auth.db, "reveals", profileId, "eks-001"))
    .toBe(1);

  await page.reload();
  await expect(
    page.locator("article").getByRole("heading", { level: 2 }),
  ).toHaveText("Nagoveštaj 1 od 2");
  await expect(chip(page, "Nagoveštaj 2/2")).toBeVisible();
  await expect(chip(page, "Proveri")).toBeVisible();
});

test("a right answer stays green and locked after a reload", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/eks-001");
  await chip(page, "Nagoveštaj 1/2").click();
  await answer(page, "2");
  await chip(page, "Proveri").click();
  await expect(status(page)).toHaveText(/^Tačno\s*uz nagoveštaj$/);
  await expect
    .poll(() => recorded(auth.db, "attempts", profileId, "eks-001"))
    .toBe(1);

  await page.reload();
  const field = fields(page).first();
  await expect(field).toHaveJSProperty("value", "2");
  await expect(field).toHaveJSProperty("readOnly", true);
  await expect(box(field)).toHaveClass(/bg-success-tint/);
  await expect(status(page)).toHaveText(/^Tačno\s*uz nagoveštaj$/);
  await expectLocked(page);
  await expect(chip(page, hints)).toBeHidden();
  await expect(chip(page, "Rezultat")).toBeHidden();
  await expect(chip(page, "Rešenje")).toBeVisible();
});

test("a part solved alone stays locked after a reload and is sent with the others", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/kv-002");
  await typeInto(page, 0, "5");
  await typeInto(page, 1, "1");
  await chip(page, "Proveri").click();
  await expect(status(page)).toContainText("1 od 3 tačno");
  await expect
    .poll(() => recorded(auth.db, "attempts", profileId, "kv-002"))
    .toBe(1);

  await page.reload();
  await expect(fields(page).nth(0)).toHaveJSProperty("value", "5");
  await expect(fields(page).nth(0)).toHaveJSProperty("readOnly", true);
  await expect(box(fields(page).nth(0))).toHaveClass(/bg-success-tint/);
  await expect(fields(page).nth(1)).toHaveJSProperty("readOnly", false);
  await expect(fields(page).nth(2)).toHaveJSProperty("readOnly", false);
  await expect(chip(page, "Proveri")).toBeVisible();

  await typeInto(page, 1, "4");
  await typeInto(page, 2, "6");
  await chip(page, "Proveri").click();
  await expect(status(page)).toHaveText("Tačno");
  await expectLocked(page);
});

test("an answer sent after Rezultat was opened elsewhere is not recorded", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/eks-001");
  await page.waitForFunction(() => customElements.get("math-field"));
  const other = await page.context().newPage();
  await other.goto("/bank/eks-001");
  await chip(other, "Rezultat").click();
  await expect
    .poll(() => recorded(auth.db, "reveals", profileId, "eks-001"))
    .toBe(1);

  await answer(page, "2");
  await chip(page, "Proveri").click();
  const field = fields(page).first();
  await expect(field).toHaveJSProperty("readOnly", true);
  await expect(box(field)).toHaveClass(/bg-data-tint/);
  await expect(status(page)).toHaveText("Prikazan rezultat");
  await expectLocked(page);
  expect(await recorded(auth.db, "attempts", profileId, "eks-001")).toBe(0);
});

test("a second right answer sent from another page is not recorded", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/eks-001");
  await page.waitForFunction(() => customElements.get("math-field"));
  const other = await page.context().newPage();
  await other.goto("/bank/eks-001");
  await answer(other, "2");
  await chip(other, "Proveri").click();
  await expect(status(other)).toHaveText("Tačno");
  await expect
    .poll(() => recorded(auth.db, "attempts", profileId, "eks-001"))
    .toBe(1);

  await answer(page, "2");
  await chip(page, "Proveri").click();
  await expect(status(page)).toHaveText("Tačno");
  await expect(box(fields(page).first())).toHaveClass(/bg-success-tint/);
  await expectLocked(page);
  expect(await recorded(auth.db, "attempts", profileId, "eks-001")).toBe(1);
});

test("an answer that follows a reveal in the same sitting does not make a task solved", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await seedReveal(auth.db, profileId, "eks-001", "answer", 3);
  await seedAttempt(auth.db, profileId, "eks-001", true, 3);
  await seedReveal(auth.db, profileId, "fun-002", "answer", 6);
  await seedAttempt(auth.db, profileId, "fun-002", true, 3);
  const card = (id: string) =>
    page.getByRole("main").locator(`a[href$="/bank/${id}"]`);

  await page.goto("/bank?status=solved");
  await expect(card("fun-002").first()).toBeVisible();
  await expect(card("eks-001")).toHaveCount(0);

  await page.goto("/bank/eks-001");
  await expect(
    page.getByRole("complementary").locator("a[data-id][aria-current=page]"),
  ).toBeVisible();
  await expect(page.getByText("rešen ranije")).toHaveCount(0);

  await page.goto("/stats");
  await expect(page.getByText(/^1 od [\d.]+$/)).toBeVisible();
});
