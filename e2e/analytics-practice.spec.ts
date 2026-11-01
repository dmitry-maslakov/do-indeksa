import type { Page } from "@playwright/test";
import {
  answer,
  expect,
  flush,
  hydrated,
  mathKeys,
  needsRecorder,
  propsOf,
  type Row,
  recorded,
  test,
} from "./fixtures";

needsRecorder();

const opens = async (page: Page) =>
  (await propsOf(page, "task_opened")).map(({ via, placement }) => [
    via,
    placement,
  ]);

const levels: Record<string, string> = {
  lako: "easy",
  srednje: "medium",
  teško: "hard",
};

const answerIds = async (page: Page, name: string) =>
  (await propsOf(page, name)).map((row) => row.answer_client_id).toSorted();

const inOrder = (rows: Row["props"][]) =>
  rows.toSorted(
    (a, b) => Number(a.attempts_before) - Number(b.attempts_before),
  );

test("a task opened from Preporučeno is a picker pick", async ({ page }) => {
  await page.goto("/bank/topic/logarithms");
  await page.getByRole("link", { name: "Preporučeno" }).first().click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await expect
    .poll(() => propsOf(page, "task_opened"))
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
  await hydrated(page);
  const card = page.locator("main article a").first();
  const href = await card.getAttribute("href");
  await card.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect
    .poll(() => propsOf(page, "task_opened"))
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
    .poll(() => propsOf(page, "task_opened"))
    .toEqual([expect.objectContaining({ task_id: "eks-001", via: "direct" })]);
  const [opened] = await propsOf(page, "task_opened");
  const meta = page
    .locator("main article")
    .filter({ has: page.locator("math-field") });
  const level = await meta
    .locator("span")
    .filter({ hasText: /^(lako|srednje|teško)$/ })
    .textContent();
  const exam = /Prijemni (\d{4}) · (\d+)\. zadatak/.exec(
    (await meta.textContent()) ?? "",
  );
  expect({
    level: opened?.level,
    exam_year: opened?.exam_year,
    exam_position: opened?.exam_position,
  }).toEqual({
    level: levels[level ?? ""],
    exam_year: exam ? Number(exam[1]) : undefined,
    exam_position: exam ? Number(exam[2]) : expect.any(Number),
  });
  const session = { task_session_id: opened?.task_session_id };
  await expect
    .poll(() => propsOf(page, "help_revealed"))
    .toEqual([
      expect.objectContaining({
        ...session,
        part: "hint1",
        attempts_before: 1,
        last_verdict: "wrong",
      }),
    ]);
  await expect
    .poll(async () => inOrder(await propsOf(page, "answer_submitted")))
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
  await expect
    .poll(() => answerIds(page, "answer_input"))
    .toEqual(await answerIds(page, "answer_submitted"));
  const inputs = await propsOf(page, "answer_input");
  const inputOf = (submitted?: Row["props"]) =>
    inputs.find(
      (input) => input.answer_client_id === submitted?.answer_client_id,
    );
  const [wrong, right] = inOrder(await propsOf(page, "answer_submitted"));
  expect(inputOf(wrong)).toMatchObject({
    inputs: 1,
    field_ready_ms: expect.any(Number),
    first_focus_ms: expect.any(Number),
    edit_ms: 0,
    vk_toggles: 0,
    text_mode: false,
  });
  expect(inputOf(wrong)).not.toHaveProperty("structures");
  const second = inputOf(right);
  expect(second).toMatchObject({
    fields: 1,
    inputs: 2,
    deletes: 1,
    pastes: 0,
    latex_len: 1,
    focus_to_submit_ms: expect.any(Number),
    edit_ms: expect.any(Number),
  });
  expect(second).not.toHaveProperty("field_ready_ms");
  expect(second).not.toHaveProperty("first_focus_ms");
});

test("opening Rezultat records the answer as revealed", async ({ page }) => {
  await page.goto("/bank/eks-001");
  await page.getByRole("button", { name: "Rezultat" }).click();
  await flush(page);
  await expect
    .poll(() => propsOf(page, "help_revealed"))
    .toEqual([
      expect.objectContaining({ part: "answer", context: "practice" }),
    ]);
  await expect
    .poll(async () =>
      (await recorded(page, "task_left")).map(({ props }) => props.state),
    )
    .toContain("revealed");
});

test("the answer field records the keyboard, text mode and structures", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await answer(page, "1/2");
  const field = page.locator("math-field").first();
  await field.press("Shift+Alt+Space");
  await expect(mathKeys(page)).toBeVisible();
  await field.press("Shift+Alt+Space");
  await expect(mathKeys(page)).toBeHidden();
  await field.press("ArrowRight");
  await field.press("Shift+Alt+KeyT");
  await field.pressSequentially("ili");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "answer_input");
    })
    .toEqual([
      expect.objectContaining({
        text_mode: true,
        vk_toggles: 1,
        structures: ["frac", "text"],
      }),
    ]);
});

test.describe("on a phone", () => {
  test.use({ hasTouch: true, isMobile: true });

  test("the answer field records the math keyboard", {
    tag: "@mobile",
  }, async ({ page }) => {
    await page.goto("/bank/eks-001");
    await page.waitForFunction(() => customElements.get("math-field"));
    const keys = mathKeys(page);
    await page.locator("math-field").first().tap();
    await keys.locator('[data-keycap-value="2"]').tap();
    await keys.locator('[data-command*="commit"]').tap();
    await expect(keys).toBeHidden();
    await page.getByRole("button", { name: "Proveri" }).tap();
    await expect
      .poll(async () => {
        await flush(page);
        return propsOf(page, "answer_input");
      })
      .toEqual([expect.objectContaining({ vk_toggles: 0, latex_len: 1 })]);
  });
});

test("an answer changed after going back is still recorded", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await answer(page, "3");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Nije tačno", { exact: true })).toBeVisible();
  const field = page.locator("math-field").first();
  await field.click();
  await page.getByRole("link", { name: "Svi zadaci" }).click();
  await expect(page).toHaveURL(/\/bank\/topic\//);
  await page.goBack();
  await field.press("Backspace");
  await field.pressSequentially("2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(page.getByText("Tačno", { exact: true })).toBeVisible();
  await flush(page);

  await expect
    .poll(async () => (await answerIds(page, "answer_submitted")).length)
    .toBe(2);
  await expect
    .poll(() => answerIds(page, "answer_input"))
    .toEqual(await answerIds(page, "answer_submitted"));
});

test("leaving a task records how it was left", async ({ page }) => {
  await page.goto("/bank/eks-001");
  await answer(page, "1");
  await page.getByRole("link", { name: "Preskoči" }).click();
  await expect(page).toHaveURL(/\/bank\/(?!eks-001$)[\w-]+$/);
  await flush(page);
  await expect
    .poll(() => propsOf(page, "task_left"))
    .toContainEqual(
      expect.objectContaining({
        task_id: "eks-001",
        exit: "navigate",
        state: "typing",
        typed_len: 1,
        field_ready_ms: expect.any(Number),
      }),
    );
  const [left] = await propsOf(page, "task_left");
  expect(left?.visible_ms).toBeGreaterThan(0);
  await expect
    .poll(() => propsOf(page, "task_skipped"))
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
  await expect(page).toHaveURL(/\/bank\/topic\//);
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
      (await recorded(page, "task_left"))
        .filter(({ props }) => props.exit === "navigate")
        .map(({ route, props }) => [route, props.state]),
    )
    .toEqual([
      ["/bank/[id]", "revealed"],
      ["/bank/[id]", "untouched"],
    ]);
});

test("opening the report form is recorded, closing it is not", async ({
  page,
}) => {
  await page.goto("/bank/eks-001");
  await hydrated(page);
  const report = page.getByText("Prijavi grešku u zadatku");
  await report.click();
  await expect(page.getByRole("button", { name: "Pošalji" })).toBeVisible();
  await report.click();
  await expect(page.getByRole("button", { name: "Pošalji" })).toBeHidden();
  await flush(page);
  await expect
    .poll(() => propsOf(page, "control_used"))
    .toEqual([{ control: "report_form" }]);
});
