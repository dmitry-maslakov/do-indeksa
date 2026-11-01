import type { Client } from "pg";
import { checkerVersion } from "@/features/catalog/checker";
import { answer, expect, seedAttempt, test } from "./fixtures";

async function seed(db: Client, profileId: string) {
  await seedAttempt(db, profileId, "eks-001", false, 7);
  await seedAttempt(db, profileId, "eks-001", true, 5);
  await seedAttempt(db, profileId, "fun-002", true, 7);
  await seedAttempt(db, profileId, "fun-002", false, 5);
}

test("the bank filters tasks by their latest attempt", async ({
  page,
  auth,
}) => {
  await seed(auth.db, (await auth.signIn()).profileId);
  const task = (id: string) =>
    page.getByRole("main").locator(`a[href$="/bank/${id}"]`);

  await page.goto("/bank?status=solved");
  await expect(task("eks-001").first()).toBeVisible();
  await expect(task("fun-002")).toHaveCount(0);

  await page.goto("/bank?status=wrong");
  await expect(task("fun-002").first()).toBeVisible();
  await expect(task("eks-001")).toHaveCount(0);
});

test("the line above a task names its latest earlier attempt", async ({
  page,
  auth,
}) => {
  await seed(auth.db, (await auth.signIn()).profileId);
  const current = page
    .getByRole("complementary")
    .locator("a[data-id][aria-current=page]");

  await page.goto("/bank/eks-001");
  const meta = page.getByRole("article");
  await expect(meta.getByText("rešen ranije", { exact: true })).toBeVisible();
  await expect(current).not.toContainText("tačno");

  await page.goto("/bank/fun-002");
  await expect(meta.getByText("ranije netačno", { exact: true })).toBeVisible();
  await expect(current).not.toContainText("netačno");
});

test("the task rail keeps its rows while the student moves between tasks", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await seedAttempt(auth.db, profileId, "eks-001", true);
  const rows = page
    .getByRole("complementary")
    .locator("a[href^='/bank/']:not(nav a)");
  const current = rows.and(page.locator("[aria-current=page]"));
  const hrefs = (unmarked = false) =>
    rows.evaluateAll(
      (links, unmarked) =>
        links
          .filter((link) => !unmarked || !("kept" in link))
          .map((link) => link.getAttribute("href")),
      unmarked,
    );

  await page.goto("/bank/eks-001");
  await expect(current).toHaveAttribute("href", /\/bank\/eks-001$/);
  const before = await hrefs();
  const next = before[before.indexOf("/bank/eks-001") + 1] ?? "";
  expect(next).toMatch(/^\/bank\/[\w-]+$/);
  await rows.evaluateAll((links) => {
    for (const link of links) Object.assign(link, { kept: true });
  });
  await page.evaluate(() =>
    new MutationObserver(() => {
      if (document.querySelector("aside [data-slot=skeleton]"))
        document.documentElement.dataset.skeleton = "";
    }).observe(document.body, { childList: true, subtree: true }),
  );
  const remounted = async () =>
    (await hrefs(true)).filter(
      (href) => before.includes(href) && href !== next,
    );

  await rows.nth(before.indexOf(next)).click();
  await expect(page).toHaveURL(next);
  await expect(current).toHaveAttribute("href", next);
  expect(await remounted()).toEqual([]);

  await page.goBack();
  await expect(page).toHaveURL(/\/bank\/eks-001$/);
  await expect(current).toHaveAttribute("href", /\/bank\/eks-001$/);
  expect(await remounted()).toEqual([]);
  await expect(page.locator("html")).not.toHaveAttribute("data-skeleton");
});

test("a topic starts from its recommended task", async ({ page, auth }) => {
  await seed(auth.db, (await auth.signIn()).profileId);
  await page.goto("/bank/start/exponential-equations");
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await expect(page.getByLabel("Tema").filter({ visible: true })).toHaveValue(
    "exponential-equations",
  );
});

test("opening hints and the solution is recorded around the check", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  const open = (label: RegExp) =>
    page.getByRole("button", { name: label }).click();
  const events = async () => {
    const { rows } = await auth.db.query<{ event: string }>(
      `select part::text as event, created_at from reveals where profile_id = $1 and task_id = 'kv-002'
       union all
       select 'check', created_at from attempts where profile_id = $1 and task_id = 'kv-002'
       order by created_at`,
      [profileId],
    );
    return rows.map((row) => row.event);
  };

  await page.goto("/bank/kv-002");
  await open(/^Nagoveštaj/);
  await expect(page.getByText("Svi traženi izrazi")).toBeVisible();
  await expect.poll(events).toEqual(["hint1"]);
  await answer(page, "5");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect.poll(events).toEqual(["hint1", "check"]);
  await open(/^Rešenje$/);
  await expect(page.getByText("Realnost korena").first()).toBeVisible();
  await expect.poll(events).toEqual(["hint1", "check", "solution"]);
});

test("opening Rezultat is recorded as a reveal of the answer", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/eks-001");
  await page.getByRole("button", { name: "Rezultat" }).click();
  await expect(
    page.getByRole("link", { name: "Sledeći zadatak" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const { rows } = await auth.db.query<{ part: string }>(
        "select part::text from reveals where profile_id = $1 and task_id = 'eks-001'",
        [profileId],
      );
      return rows.map((row) => row.part);
    })
    .toEqual(["answer"]);
});

test("an unreadable answer asks to check the entry and is not a mistake", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  await page.goto("/bank/eks-001");
  await answer(page, "2+");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect(
    page.getByText("Ne možemo da pročitamo odgovor. Proveri zapis."),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const { rows } = await auth.db.query<{ outcomes: string }>(
        "select outcomes::text from attempts where profile_id = $1 and task_id = 'eks-001'",
        [profileId],
      );
      return rows.map((row) => row.outcomes);
    })
    .toEqual(["{unreadable}"]);

  await page.goto("/bank?status=wrong");
  await expect(page.locator('a[href$="/bank/eks-001"]')).toHaveCount(0);
});

test("a task visit is one session and a long pause starts another", async ({
  page,
  auth,
}) => {
  const { profileId } = await auth.signIn();
  const sessions = async () =>
    (
      await auth.db.query<{ id: string; attempts: number }>(
        `select s.id, count(a.id)::int as attempts from task_sessions s
         left join attempts a on a.session_id = s.id
         where s.profile_id = $1 and s.task_id = 'eks-001'
         group by s.id order by min(s.started_at)`,
        [profileId],
      )
    ).rows;

  await page.goto("/bank/eks-001");
  await expect.poll(async () => (await sessions()).length).toBe(1);
  await answer(page, "2");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect
    .poll(sessions)
    .toEqual([{ id: expect.any(String), attempts: 1 }]);

  await auth.db.query(
    "update task_sessions set last_seen_at = now() - interval '1 minute' where profile_id = $1",
    [profileId],
  );
  await page.getByRole("button", { name: "Rešenje" }).click();
  await expect.poll(async () => (await sessions()).length).toBe(2);
});

test.describe("attempt log", () => {
  test.use({ timezoneId: "Europe/Belgrade" });

  test("keeps what an attempt needs to be recomputed later", async ({
    page,
    auth,
  }) => {
    const { profileId } = await auth.signIn();
    const sessions = async () =>
      (
        await auth.db.query<{ kind: string; tz: string | null }>(
          `select kind, tz from task_sessions
           where profile_id = $1 and task_id = 'eks-001' order by started_at`,
          [profileId],
        )
      ).rows;

    await page.goto("/bank/eks-001");
    await answer(page, "5");
    await page.getByRole("button", { name: "Proveri" }).click();
    await expect
      .poll(async () => {
        const { rows } = await auth.db.query(
          `select difficulty, length(key_rev) as key_rev, checker from attempts
           where profile_id = $1 and task_id = 'eks-001'`,
          [profileId],
        );
        return rows;
      })
      .toEqual([
        {
          difficulty: expect.any(Number),
          key_rev: 12,
          checker: checkerVersion,
        },
      ]);
    expect(await sessions()).toEqual([
      { kind: "first", tz: "Europe/Belgrade" },
    ]);

    await page.getByRole("link", { name: "Dalje" }).click();
    await expect
      .poll(async () => {
        const { rows } = await auth.db.query(
          "select count(*)::int as n from skips where profile_id = $1 and task_id = 'eks-001'",
          [profileId],
        );
        return rows[0]?.n;
      })
      .toBe(1);

    await page.goto("/bank");
    for (const table of ["attempts", "skips"])
      await auth.db.query(
        `update ${table} set created_at = now() - interval '2 hours' where profile_id = $1`,
        [profileId],
      );
    await auth.db.query(
      "update task_sessions set last_seen_at = now() - interval '2 hours' where profile_id = $1",
      [profileId],
    );
    await page.goto("/bank/eks-001");
    await expect
      .poll(async () => (await sessions()).map((s) => s.kind))
      .toEqual(["first", "retry"]);
  });

  test("a first visit with only a hint keeps the first attempt", async ({
    page,
    auth,
  }) => {
    const { profileId } = await auth.signIn();
    const kinds = async () =>
      (
        await auth.db.query<{ kind: string }>(
          `select kind from task_sessions
           where profile_id = $1 and task_id = 'eks-001' order by started_at`,
          [profileId],
        )
      ).rows.map((s) => s.kind);

    await page.goto("/bank/eks-001");
    await page.getByRole("button", { name: "Nagoveštaj" }).click();
    await expect
      .poll(async () => {
        const { rows } = await auth.db.query(
          "select count(*)::int as n from reveals where profile_id = $1",
          [profileId],
        );
        return rows[0]?.n;
      })
      .toBe(1);

    await page.goto("/bank");
    await auth.db.query(
      "update reveals set created_at = now() - interval '2 hours' where profile_id = $1",
      [profileId],
    );
    await auth.db.query(
      "update task_sessions set last_seen_at = now() - interval '2 hours' where profile_id = $1",
      [profileId],
    );
    await page.goto("/bank/eks-001");
    await expect.poll(kinds).toEqual(["first", "first"]);
  });
});
