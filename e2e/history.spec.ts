import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import type { Client } from "pg";
import { expect, test } from "./fixtures";

test.use({ viewport: { width: 1280, height: 400 } });

const seedTests = (db: Client, profileId: string, count: number) =>
  db.query(
    `insert into test_sessions (id, profile_id, kind, variant_id, task_ids, started_at, finished_at)
     select gen_random_uuid(), $1::uuid, 'custom'::test_kind, 'set-eks-00' || n,
       '{}'::text[], now() - n * interval '1 hour', now() - n * interval '1 hour'
     from generate_series(1, $2::int) n`,
    [profileId, count],
  );

const feed = async (page: Page) =>
  (await page.request.get("/api/tests?offset=0&locale=sr-Latn")).json();

test("the run history loads older runs while scrolling", async ({
  page,
  auth,
  errors,
}) => {
  await seedTests(auth.db, (await auth.signIn()).profileId, 25);
  await page.goto("/variants?tab=history");
  const rows = page.getByRole("img", { name: "0 od 0 tačno" });
  const more = page.getByRole("button", { name: "Prikaži još" });
  await expect(rows).toHaveCount(20);

  await more.scrollIntoViewIfNeeded();
  await expect(rows).toHaveCount(25);
  await expect(more).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a finished variant shows its result in the catalog", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/variants");
  const first = page.locator('main li a[href^="/variants/"]').first();
  const href = (await first.getAttribute("href")) ?? "";
  const testId = randomUUID();
  await auth.db.query(
    `insert into test_sessions (id, profile_id, kind, variant_id, task_ids, started_at, finished_at)
     values ($1, $2, 'official', $3, '{}', now(), now())`,
    [testId, profileId, href.split("/").at(-1)],
  );
  await page.reload();
  const row = page
    .locator("li")
    .filter({ has: page.locator(`a[href="/review/${testId.slice(0, 8)}"]`) });
  await expect(row).toContainText("Pregled");
  await expect(row).toContainText("rešeno");
  await expect(page.locator(`a[href="${href}"]`)).toHaveCount(0);
});

test("a finished weekly variant shows its score and review in the weekly card", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/variants");
  const start = page.getByRole("link", { name: "Počni varijantu →" });
  const href = (await start.getAttribute("href")) ?? "";
  const testId = randomUUID();
  await auth.db.query(
    `insert into test_sessions (id, profile_id, kind, variant_id, task_ids, started_at, finished_at)
     values ($1, $2, 'official', $3, '{}', now(), now())`,
    [testId, profileId, href.split("/").at(-1)],
  );
  await page.reload();
  const card = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Varijanta nedelje" }),
  });
  await expect(card).toContainText("0 / 0");
  await expect(card).toContainText("Nova varijanta za");
  await expect(card.getByRole("link", { name: "Pregled →" })).toHaveAttribute(
    "href",
    `/review/${testId.slice(0, 8)}`,
  );
  await expect(start).toHaveCount(0);
});

test("the test feed returns only the caller's tests", async ({
  page,
  auth,
}) => {
  await seedTests(auth.db, (await auth.signIn()).profileId, 3);
  expect((await feed(page)).items).toHaveLength(3);

  await auth.signIn();
  expect(await feed(page)).toEqual({ items: [], next: null });
});

test("the test feed is empty without a profile and rejects malformed pages", async ({
  request,
}) => {
  const guest = await request.get("/api/tests?offset=0&locale=sr-Latn");
  expect(await guest.json()).toEqual({ items: [], next: null });
  const malformed = await request.get("/api/tests?offset=-1&locale=xx");
  expect(malformed.status()).toBe(400);
});
