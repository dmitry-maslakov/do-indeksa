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

async function seed(db: Client, userId: string) {
  await attempt(db, userId, "eks-001", false, 3);
  await attempt(db, userId, "eks-001", true, 1);
  await attempt(db, userId, "fun-002", true, 3);
  await attempt(db, userId, "fun-002", false, 1);
}

test("the bank filters tasks by their latest attempt", async ({
  page,
  auth,
}) => {
  await seed(auth.db, await auth.signIn());
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
  await seed(auth.db, await auth.signIn());
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
  await seed(auth.db, await auth.signIn());
  await page.goto("/bank/start/exponential-equations");
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await expect(page.getByLabel("Tema").filter({ visible: true })).toHaveValue(
    "exponential-equations",
  );
});

test("the home page counts tasks whose latest attempt is wrong", async ({
  page,
  auth,
}) => {
  await seed(auth.db, await auth.signIn());
  await page.goto("/");

  await expect(page.getByText("1 zadatak sa greškom")).toBeVisible();
});
