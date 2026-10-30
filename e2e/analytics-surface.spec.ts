import {
  answer,
  expect,
  flush,
  hydrated,
  needsRecorder,
  noId,
  propsOf,
  recorded,
  test,
} from "./fixtures";

needsRecorder();

test("home records the suggestion and the picks a visitor sees", async ({
  page,
}) => {
  await page.goto("/");
  const start = page.getByRole("link", { name: "Počni →" });
  await expect(start).toBeVisible();
  await hydrated(page);
  const taskId = (await start.getAttribute("href"))?.split("/").at(-1);
  await page.getByRole("link", { name: "ili izaberi drugu temu ↓" }).click();
  await expect(page).toHaveURL(/#topic-map$/);

  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "recommendation_made");
    })
    .toContainEqual({
      surface: "home_hero",
      task_id: taskId,
      topic: "complex-numbers",
      algo_version: 1,
      repeat: false,
      slot: 1,
    });
  expect(await propsOf(page, "recommendation_made")).toContainEqual(
    expect.objectContaining({ surface: "topic_row" }),
  );
  await expect
    .poll(() => recorded(page, "suggestion_shown"))
    .toEqual([
      expect.objectContaining({
        profile_id: noId,
        props: { topic: "complex-numbers", reason: "first" },
      }),
    ]);

  await page.getByRole("banner").getByRole("link", { name: "Teorija" }).click();
  await expect(page).toHaveURL(/\/theory$/);
  await page.goBack();
  await expect(start).toBeVisible();
  await page.getByRole("button", { name: "Nije početo" }).click();
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "control_used");
    })
    .toEqual([
      { control: "other_topic" },
      { control: "topic_map_filter", value: "notStarted" },
    ]);
  const heroes = (await propsOf(page, "recommendation_made")).filter(
    ({ surface }) => surface === "home_hero",
  );
  expect(heroes).toHaveLength(1);
  expect(await recorded(page, "suggestion_shown")).toHaveLength(1);

  await start.click();
  await expect(page).toHaveURL(new RegExp(`/bank/${taskId}$`));
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "suggestion_opened");
    })
    .toEqual([
      {
        topic: "complex-numbers",
        reason: "first",
        since_shown_ms: expect.any(Number),
      },
    ]);
});

test("an opened suggestion keeps the id it was stored with", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/");
  await hydrated(page);
  await expect
    .poll(() => recorded(page, "suggestion_shown"))
    .toEqual([
      expect.objectContaining({
        profile_id: profileId,
        props: expect.objectContaining({ suggestion_id: expect.any(String) }),
      }),
    ]);
  const [shown] = await recorded(page, "suggestion_shown");
  const id = shown?.props.suggestion_id;

  await page.getByRole("link", { name: "Počni →" }).click();
  await expect(page).toHaveURL(/\/bank\/[\w-]+$/);
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "suggestion_opened");
    })
    .toEqual([expect.objectContaining({ suggestion_id: id })]);
  await expect
    .poll(
      async () =>
        (
          await auth.db.query(
            "select opened_at from suggestions where id = $1",
            [id],
          )
        ).rows[0]?.opened_at,
    )
    .toBeInstanceOf(Date);
});

test("the task page records the picks next to a task", async ({ page }) => {
  await page.goto("/bank/eks-001");
  await hydrated(page);
  const skip = page.getByRole("link", { name: "Preskoči" });
  const next = (await skip.getAttribute("href"))?.split("/").at(-1);
  const pick = {
    task_id: next,
    topic: "exponential-equations",
    algo_version: 1,
    repeat: false,
    slot: 1,
  };

  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "recommendation_made");
    })
    .toEqual(
      expect.arrayContaining([
        { surface: "rail_upcoming", ...pick },
        { surface: "skip", ...pick },
      ]),
    );

  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(
    page.getByRole("link", { name: "Sledeći zadatak" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "recommendation_made");
    })
    .toContainEqual({ surface: "next", ...pick });
});

test("the bank records its pick, results and filter changes", async ({
  page,
}) => {
  await page.goto("/bank");
  await hydrated(page);
  const count = Number(
    (
      await page.getByText(/^\d+(\.\d{3})* zadat(ak|ka|aka)$/).textContent()
    )?.replace(/\D/g, ""),
  );

  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "bank_results_shown");
    })
    .toEqual([{ results: count }]);
  await expect
    .poll(async () =>
      (await propsOf(page, "recommendation_made")).map(
        ({ surface }) => surface,
      ),
    )
    .toEqual(["bank_tab"]);
  const [pick] = await propsOf(page, "recommendation_made");

  await page
    .getByRole("combobox", { name: "Tema", exact: true })
    .selectOption({ label: "Logaritmi" });
  await expect(page).toHaveURL(/topic=logarithms/);
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "bank_results_shown");
    })
    .toContainEqual(expect.objectContaining({ topic: "logarithms" }));
  await expect
    .poll(async () =>
      (await propsOf(page, "recommendation_made")).map(({ topic }) => topic),
    )
    .toContain("logarithms");

  await page
    .getByRole("complementary")
    .getByRole("link", { name: "Poništi filtere" })
    .click();
  await expect(page).toHaveURL(/\/bank$/);
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "bank_results_shown");
    })
    .toEqual([
      { results: count },
      expect.objectContaining({ topic: "logarithms" }),
      { results: count },
    ]);
  expect(
    (await propsOf(page, "recommendation_made")).map(({ topic }) => topic),
  ).toEqual([pick?.topic, "logarithms", pick?.topic]);
  expect(await propsOf(page, "control_used")).toEqual([
    { control: "bank_filters_reset" },
  ]);
});

test("an empty bank search is recorded by its length", async ({ page }) => {
  await page.goto("/bank?q=zzzzqq");
  await expect(page.getByText("Nema zadataka za ove filtere.")).toBeVisible();
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "bank_results_shown");
    })
    .toEqual([{ q_len: 6, results: 0 }]);
});

test("theory records how far a page was read", async ({ page }) => {
  await page.goto("/theory/exponential-equations");
  await hydrated(page);
  const rail = page.getByRole("complementary", { name: "Teorija" });
  const last = rail.locator('a[href*="#"]').last();
  const section = (await last.getAttribute("href"))?.split("#").at(-1);
  await last.click();
  await expect(page).toHaveURL(new RegExp(`#${section}$`));
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(
    () => innerHeight + scrollY >= document.documentElement.scrollHeight - 1,
  );
  await flush(page);

  await expect
    .poll(() => propsOf(page, "theory_read"))
    .toEqual([
      expect.objectContaining({
        topic: "exponential-equations",
        page: "topic",
        max_scroll_pct: 100,
        exit: "pagehide",
        seq: 1,
      }),
    ]);
  const [read] = await propsOf(page, "theory_read");
  expect(read?.sections).toBeGreaterThan(0);
  expect(read?.sections_reached).toBe(read?.sections);
  expect(read?.last_section).toBe(section);

  await rail.getByRole("link", { name: "Metodi", exact: true }).click();
  await expect(page).toHaveURL(/\/methods\/[\w-]+$/);
  await expect
    .poll(async () => {
      await flush(page);
      return propsOf(page, "theory_read");
    })
    .toContainEqual(
      expect.objectContaining({
        read_id: read?.read_id,
        page: "topic",
        exit: "navigate",
        seq: 2,
      }),
    );
  expect(
    (await recorded(page, "theory_read"))
      .filter(({ props }) => props.page === "topic")
      .map(({ route }) => route),
  ).toEqual(["/theory/[topic]", "/theory/[topic]"]);
  expect(await propsOf(page, "control_used")).toEqual([
    { control: "theory_section_link", value: section },
    { control: "theory_tab", value: "methods" },
  ]);
});
