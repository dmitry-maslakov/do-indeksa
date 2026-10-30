import type { Page } from "@playwright/test";
import { answer, expect, test } from "./fixtures";

interface Row {
  name: string;
  aid: string;
  route: string;
  props: Record<string, unknown>;
}

const recorder = process.env.ANALYTICS_CLICKHOUSE_URL;

test.skip(!recorder, "needs ANALYTICS_CLICKHOUSE_URL pointing at the recorder");

const aidOf = async (page: Page) =>
  (await page.context().cookies()).find((c) => c.name === "aid")?.value;

async function rowsOf(page: Page, name: string) {
  const aid = await aidOf(page);
  const rows = (await (await fetch(`${recorder}/rows`)).json()) as Row[];
  return rows.filter((row) => row.aid === aid && row.name === name);
}

const recorded = async (page: Page, name: string) =>
  (await rowsOf(page, name)).map(({ props }) => props);

const opens = async (page: Page) =>
  (await recorded(page, "task_opened")).map(({ via, placement }) => [
    via,
    placement,
  ]);

const inOrder = (rows: Row["props"][]) =>
  rows.toSorted(
    (a, b) => Number(a.attempts_before) - Number(b.attempts_before),
  );

const flush = (page: Page) =>
  page.evaluate(() => dispatchEvent(new Event("pagehide")));

test("a task opened from Preporučeno is a picker pick", async ({ page }) => {
  await page.goto("/bank?topic=logarithms");
  await page.getByRole("link", { name: "Preporučeno" }).first().click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await expect
    .poll(() => recorded(page, "task_opened"))
    .toEqual([
      expect.objectContaining({
        topic: "logarithms",
        via: "picker",
        placement: "bank_tab",
        session_kind: "first",
        status_before: "new",
      }),
    ]);
});

test("a task opened from a bank card is a list pick", async ({ page }) => {
  await page.goto("/bank");
  const card = page.locator("main article a").first();
  const href = await card.getAttribute("href");
  await card.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect
    .poll(() => recorded(page, "task_opened"))
    .toEqual([
      expect.objectContaining({
        task_id: href?.split("/").at(-1),
        via: "list",
        placement: "card",
        rank: 1,
      }),
    ]);
});

test("checking an answer records the input and the attempt", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await answer(page, "3");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Nije tačno", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nagoveštaj" }).click();
  await page.locator("math-field").first().press("Backspace");
  await page.locator("math-field").first().pressSequentially("2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  await flush(page);

  await expect
    .poll(() => recorded(page, "task_opened"))
    .toEqual([expect.objectContaining({ task_id: "eks-001", via: "direct" })]);
  const [opened] = await recorded(page, "task_opened");
  const session = { task_session_id: opened?.task_session_id };
  await expect
    .poll(() => recorded(page, "help_revealed"))
    .toEqual([
      expect.objectContaining({
        ...session,
        part: "hint1",
        attempts_before: 1,
        last_verdict: "wrong",
      }),
    ]);
  await expect
    .poll(async () => inOrder(await recorded(page, "answer_submitted")))
    .toEqual([
      expect.objectContaining({
        ...session,
        verdict: "wrong",
        attempts_before: 0,
        last_verdict: "none",
        hints_before: 0,
      }),
      expect.objectContaining({
        ...session,
        verdict: "correct",
        correct: true,
        outcomes: ["right"],
        attempts_before: 1,
        last_verdict: "wrong",
        hints_before: 1,
      }),
    ]);
  const ids = async (name: string) =>
    (await recorded(page, name)).map((row) => row.answer_client_id).toSorted();
  await expect
    .poll(() => ids("answer_input"))
    .toEqual(await ids("answer_submitted"));
  const [, right] = inOrder(await recorded(page, "answer_submitted"));
  expect(
    (await recorded(page, "answer_input")).find(
      (input) => input.answer_client_id === right?.answer_client_id,
    ),
  ).toMatchObject({
    fields: 1,
    deletes: 1,
    pastes: 0,
    latex_len: 1,
    focus_to_submit_ms: expect.any(Number),
  });
});

test("leaving a task records how it was left", async ({ page }) => {
  await page.goto("/bank/eks-001");
  await answer(page, "1");
  await page.getByRole("link", { name: "Preskoči" }).click();
  await expect(page).toHaveURL(/\/bank\/(?!eks-001$)[\w-]+$/);
  await flush(page);
  await expect
    .poll(() => recorded(page, "task_left"))
    .toContainEqual(
      expect.objectContaining({
        task_id: "eks-001",
        exit: "navigate",
        state: "typing",
        typed_len: 1,
      }),
    );
  const [left] = await recorded(page, "task_left");
  expect(left?.visible_ms).toBeGreaterThan(0);
  await expect
    .poll(() => recorded(page, "task_skipped"))
    .toEqual([expect.objectContaining({ task_id: "eks-001" })]);
  await expect
    .poll(() => opens(page))
    .toEqual([
      ["direct", undefined],
      ["picker", "skip"],
    ]);
});

test("opens from the hero, the next link and a reload are told apart", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Počni →" }).click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await page.goto("/bank/eks-001");
  await page.getByRole("button", { name: "Rešenje" }).click();
  await page.getByRole("link", { name: "Sledeći zadatak" }).click();
  await expect(page).toHaveURL(/\/bank\/(?!eks-001$)[\w-]+$/);
  await page.reload();
  await page.getByRole("link", { name: "Svi zadaci" }).click();
  await expect(page).toHaveURL(/\/bank\?topic=/);
  await flush(page);
  await expect
    .poll(() => opens(page))
    .toEqual([
      ["picker", "home_hero"],
      ["direct", undefined],
      ["picker", "next"],
      ["history", undefined],
    ]);
  await expect
    .poll(async () =>
      (await rowsOf(page, "task_left"))
        .filter(({ props }) => props.exit === "navigate")
        .map(({ route, props }) => [route, props.state]),
    )
    .toEqual([
      ["/bank/[id]", "revealed"],
      ["/bank/[id]", "untouched"],
    ]);
});
