import type { Page } from "@playwright/test";
import {
  aidOf,
  answer,
  expect,
  finish,
  flush,
  hydrated,
  needsRecorder,
  propsOf,
  type Row,
  rows,
  test,
} from "./fixtures";

needsRecorder();

const testEvents = new Set([
  "variant_compose_started",
  "test_started",
  "test_resumed",
  "test_task_viewed",
  "test_task_swapped",
  "test_left",
  "test_finished",
  "result_shared",
]);

const testRows = (aid?: string) =>
  rows((row) => row.aid === aid && testEvents.has(row.name));

const shown = (page: Page, text: RegExp) =>
  page.getByText(text).filter({ visible: true });

const summary = ({ name, props }: Row) =>
  [name, props.nav ?? props.from ?? props.exit ?? props.method, props.position]
    .filter((value) => value !== undefined)
    .join(" ");

test("a composed test records its start, views, swap and finish", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/variants");
  await page.getByRole("button", { name: "Počni →" }).click();
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  const first = page.url();
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  await page.getByRole("button", { name: "Sledeći" }).click();
  await rail.getByRole("button", { name: /Eksponencijalne/ }).click();
  await expect(page.getByText("Zadatak 4 · 6 bodova")).toBeVisible();

  await page.getByRole("banner").getByRole("link", { name: "Teorija" }).click();
  await expect(page).toHaveURL(/\/theory$/);
  await page.goBack();
  await expect(page).toHaveURL(first);
  await expect(page.getByText("Zadatak 4 · 6 bodova")).toBeVisible();

  await page.getByRole("button", { name: "Zameni zadatak 4" }).click();
  await expect(page).not.toHaveURL(first);
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  await answer(page, "1");
  await expect(page.locator("input[name=answer]").first()).not.toHaveValue("");
  const sentLength = await page
    .locator("input[name=answer]")
    .evaluateAll((inputs) =>
      inputs.reduce(
        (sum, input) => sum + (input as HTMLInputElement).value.length,
        0,
      ),
    );
  await finish(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await page.getByRole("button", { name: "Podeli" }).click();
  await expect(
    page.getByRole("button", { name: "Link je kopiran" }),
  ).toBeVisible();
  await flush(page);

  const aid = await aidOf(page);
  await expect
    .poll(async () => (await testRows(aid)).map(summary).toSorted())
    .toEqual(
      [
        "variant_compose_started",
        "test_started",
        "test_task_viewed start 1",
        "test_task_viewed next 2",
        "test_task_viewed rail 4",
        "test_left navigate 4",
        "test_resumed local",
        "test_task_viewed resume 4",
        "test_task_swapped 4",
        "test_started",
        "test_task_viewed start 4",
        "test_finished",
        "result_shared clipboard",
      ].toSorted(),
    );

  const events = await testRows(aid);
  const one = (name: string) => events.find((row) => row.name === name)?.props;
  const swapped = one("test_task_swapped");
  const facts = { variant_kind: "custom", tasks: 10, minutes: 240 };
  expect(one("variant_compose_started")).toEqual({
    mode: "exam",
    preset: "all",
    size: 10,
  });
  expect(
    events
      .filter(({ name }) => name === "test_started")
      .map(({ props }) => props),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ...facts,
        test_session_id: swapped?.test_session_id,
        via: "compose",
      }),
      expect.objectContaining({
        ...facts,
        test_session_id: swapped?.to_test_session_id,
        via: "direct",
      }),
    ]),
  );
  expect(swapped).toMatchObject({
    from_task_id: expect.any(String),
    to_task_id: expect.any(String),
  });
  expect(swapped?.to_task_id).not.toBe(swapped?.from_task_id);
  expect(one("test_resumed")).toMatchObject({
    test_session_id: swapped?.test_session_id,
  });
  const finished = events.find(({ name }) => name === "test_finished");
  expect(finished).toMatchObject({
    source: "server",
    props: {
      ...facts,
      test_session_id: swapped?.to_test_session_id,
      answered: 1,
      unanswered: [1, 2, 3, 5, 6, 7, 8, 9, 10],
      weekly: false,
      max_points: 60,
      overtime: false,
      visits: 3,
      positions_visited: 3,
    },
  });
  const answered = {
    context: "test",
    test_session_id: swapped?.to_test_session_id,
    position: 4,
    task_id: swapped?.to_task_id,
  };
  await expect
    .poll(() => propsOf(page, "answer_submitted"))
    .toEqual([expect.objectContaining({ ...answered, session_kind: "mock" })]);
  const [submitted] = await propsOf(page, "answer_submitted");
  expect(await propsOf(page, "answer_input")).toEqual([
    expect.objectContaining({
      ...answered,
      fields: submitted?.parts,
      latex_len: sentLength,
    }),
  ]);
  const score = String(finished?.props.score).replace(".", ",");
  await expect(
    page.locator("p").filter({ hasText: "od 60 bodova" }),
  ).toHaveText(new RegExp(`^${score}\\s*od 60 bodova$`));
  expect(one("result_shared")).toMatchObject({
    variant_id: expect.stringMatching(/^set-/),
    ok: true,
  });

  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).search).toBe("?utm_source=share&utm_medium=variant");
  await page.goto(link);
  await expect(page).toHaveURL(/\/v\/[2-9A-HJKMNP-Z]{5}$/);
  await expect(shown(page, /^Zadatak 1 · /)).toBeVisible();
  await flush(page);
  await expect
    .poll(async () =>
      (await rows((row) => row.aid === aid && row.name === "page_view")).map(
        ({ utm_source }) => utm_source,
      ),
    )
    .toContain("share");
  await expect
    .poll(async () =>
      (await propsOf(page, "test_started")).map(({ via }) => via),
    )
    .toContain("share");
});

test("a test records its answers, controls and where it was started", async ({
  page,
}) => {
  await page.goto("/variants");
  await hydrated(page);
  const exam = page
    .getByRole("main")
    .getByRole("link", { name: /^\d{4}$/ })
    .first();
  const href = await exam.getAttribute("href");
  await exam.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  const rail = page.getByRole("complementary", { name: "Zadaci" });
  await rail.getByRole("button", { name: "Sakrij" }).click();
  await rail.getByRole("button", { name: "Prikaži" }).click();
  await answer(page, "1");
  await page.getByRole("button", { name: "Sledeći" }).click();
  await expect(shown(page, /^Zadatak 2 · /)).toBeVisible();
  await page.getByRole("button", { name: /^Završi( test)?$/ }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Nastavi" })
    .click();
  await expect(page.getByRole("alertdialog")).toBeHidden();
  await finish(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);

  const row = page.getByRole("main").locator("details > summary").first();
  await row.click();
  await row.click();
  await page.getByRole("button", { name: "Reši ponovo" }).click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(shown(page, /^Zadatak 1 · /)).toBeVisible();
  await flush(page);

  const variantId = href?.split("/").at(-1);
  await expect
    .poll(async () =>
      (await propsOf(page, "test_started")).map((started) => [
        started.variant_id === variantId,
        started.via,
        started.placement,
      ]),
    )
    .toEqual([
      [true, "catalog", undefined],
      [true, "review", "retry"],
    ]);
  await expect
    .poll(async () =>
      (await propsOf(page, "control_used"))
        .map(({ control, value }) => [control, value].join(" ").trim())
        .toSorted(),
    )
    .toEqual(
      [
        "timer hide",
        "timer show",
        "finish_dialog opened",
        "finish_dialog cancelled",
        "finish_dialog opened",
        "review_row 1",
      ].toSorted(),
    );

  const [started] = await propsOf(page, "test_started");
  const answered = {
    context: "test",
    test_session_id: started?.test_session_id,
    position: 1,
  };
  await expect
    .poll(() => propsOf(page, "answer_submitted"))
    .toEqual([
      expect.objectContaining({
        ...answered,
        variant_kind: started?.variant_kind,
        visits: 1,
      }),
    ]);
  const [submitted] = await propsOf(page, "answer_submitted");
  const inputs = await propsOf(page, "answer_input");
  expect(inputs).toEqual([
    expect.objectContaining({
      ...answered,
      task_id: submitted?.task_id,
      deletes: 0,
      pastes: 0,
      vk_toggles: 0,
      text_mode: false,
      field_ready_ms: expect.any(Number),
      first_focus_ms: expect.any(Number),
      edit_ms: 0,
      latex_len: 1,
    }),
  ]);
  expect(inputs[0]).not.toHaveProperty("structures");
});

test("tests started from home record the year or the weekly card", async ({
  page,
}) => {
  await page.goto("/");
  await hydrated(page);
  const year = page.getByRole("link", { name: /^\d{4}$/ }).first();
  const exam = await year.getAttribute("href");
  await year.click();
  await expect(page).toHaveURL(new RegExp(`${exam}$`));
  await expect(shown(page, /^Zadatak 1 · /)).toBeVisible();
  await page.goBack();
  const weekly = page.getByRole("link", { name: "Počni varijantu →" });
  const href = await weekly.getAttribute("href");
  await weekly.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(shown(page, /^Zadatak 1 · /)).toBeVisible();
  await flush(page);

  await expect
    .poll(async () =>
      (await propsOf(page, "test_started")).map(({ variant_id, via }) => [
        variant_id,
        via,
      ]),
    )
    .toEqual([
      [exam?.split("/").at(-1), "exam_years"],
      [href?.split("/").at(-1), "weekly"],
    ]);
});
