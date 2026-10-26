import type { Client } from "pg";
import { answer, expect, seedAttempt, test } from "./fixtures";

async function seed(db: Client, profileId: string) {
  await seedAttempt(db, profileId, "eks-001", false, 3);
  await seedAttempt(db, profileId, "eks-001", true, 1);
  await seedAttempt(db, profileId, "fun-002", true, 3);
  await seedAttempt(db, profileId, "fun-002", false, 1);
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

test("the task rail marks the latest attempt", async ({ page, auth }) => {
  await seed(auth.db, (await auth.signIn()).profileId);
  const row = (id: string, mark: string) =>
    page
      .getByRole("complementary")
      .locator(`a[href$="/bank/${id}"]`)
      .getByRole("img", { name: mark, exact: true });

  await page.goto("/bank/eks-001");
  await expect(row("eks-001", "tačno")).toBeVisible();

  await page.goto("/bank/fun-002");
  await expect(row("fun-002", "netačno")).toBeVisible();
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
  const open = (label: string) =>
    page.getByRole("button", { name: label, exact: true }).click();
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
  await open("Nagoveštaj");
  await expect(page.getByText("Svi traženi izrazi")).toBeVisible();
  await expect.poll(events).toEqual(["hint1"]);
  await answer(page, "5");
  await page.getByRole("button", { name: "Proveri" }).click();
  await expect.poll(events).toEqual(["hint1", "check"]);
  await open("Rešenje");
  await expect(page.getByText("Realnost korena").first()).toBeVisible();
  await expect.poll(events).toEqual(["hint1", "check", "solution"]);
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
  await page.getByRole("button", { name: "Nagoveštaj" }).click();
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
      .toEqual([{ difficulty: expect.any(Number), key_rev: 12, checker: 1 }]);
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
});
