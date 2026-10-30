import { answer, expect, finish, test } from "./fixtures";

interface Row {
  name: string;
  aid: string;
  source: string;
  utm_source: string;
  props: Record<string, unknown>;
}

const recorder = process.env.ANALYTICS_CLICKHOUSE_URL;

test.skip(!recorder, "needs ANALYTICS_CLICKHOUSE_URL pointing at the recorder");

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

const rowsOf = async (aid?: string) =>
  ((await (await fetch(`${recorder}/rows`)).json()) as Row[]).filter(
    (row) => row.aid === aid,
  );

const recorded = async (aid?: string) =>
  (await rowsOf(aid)).filter((row) => testEvents.has(row.name));

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
  await finish(page);
  await expect(page).toHaveURL(/\/review\/[0-9a-f]{8}$/);
  await page.getByRole("button", { name: "Podeli" }).click();
  await expect(
    page.getByRole("button", { name: "Link je kopiran" }),
  ).toBeVisible();
  await page.evaluate(() => dispatchEvent(new Event("pagehide")));

  const aid = (await context.cookies()).find((c) => c.name === "aid")?.value;
  await expect
    .poll(async () => (await recorded(aid)).map(summary).toSorted())
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

  const rows = await recorded(aid);
  const one = (name: string) => rows.find((row) => row.name === name)?.props;
  const swapped = one("test_task_swapped");
  const facts = { variant_kind: "custom", tasks: 10, minutes: 240 };
  expect(one("variant_compose_started")).toEqual({
    mode: "exam",
    preset: "all",
    size: 10,
  });
  expect(
    rows
      .filter(({ name }) => name === "test_started")
      .map(({ props }) => props),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ...facts,
        test_session_id: swapped?.test_session_id,
      }),
      expect.objectContaining({
        ...facts,
        test_session_id: swapped?.to_test_session_id,
      }),
    ]),
  );
  expect(swapped).toMatchObject({
    from_task_id: expect.stringMatching(/^eks-/),
    to_task_id: expect.stringMatching(/^eks-/),
  });
  expect(swapped?.to_task_id).not.toBe(swapped?.from_task_id);
  expect(one("test_resumed")).toMatchObject({
    test_session_id: swapped?.test_session_id,
  });
  const finished = rows.find(({ name }) => name === "test_finished");
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
  await expect
    .poll(async () =>
      (await rowsOf(aid)).some(
        (row) => row.name === "page_view" && row.utm_source === "share",
      ),
    )
    .toBe(true);
});
