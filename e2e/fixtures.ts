import { createHmac, randomInt, randomUUID } from "node:crypto";
import { test as base, type Page } from "@playwright/test";
import { allTasks } from "content-collections";
import { Client } from "pg";

export { expect } from "@playwright/test";

const { DATABASE_URL, BETTER_AUTH_SECRET = "" } = process.env;

export interface Row {
  name: string;
  source: string;
  aid: string;
  profile_id: string;
  route: string;
  locale: string;
  bot: boolean;
  utm_source: string;
  utm_campaign: string;
  props: Record<string, unknown>;
}

interface Auth {
  db: Client;
  signIn: (age?: number) => Promise<{ userId: string; profileId: string }>;
}

const clientIp = () =>
  ["10", ...Array.from({ length: 3 }, () => randomInt(256))].join(".");

export const test = base.extend<{ auth: Auth; errors: string[] }>({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use) =>
    use({ ...extraHTTPHeaders, "cf-connecting-ip": clientIp() }),
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await use(errors);
  },
  auth: async ({ context }, use) => {
    if (process.env.CI && (!DATABASE_URL || !BETTER_AUTH_SECRET))
      throw new Error(
        "the auth fixture needs DATABASE_URL and BETTER_AUTH_SECRET",
      );
    test.skip(!DATABASE_URL || !BETTER_AUTH_SECRET, "needs the database");
    const db = new Client({ connectionString: DATABASE_URL });
    await db.connect();
    const users: string[] = [];

    await use({
      db,
      signIn: async (age = 0) => {
        const userId = randomUUID();
        const token = randomUUID();
        users.push(userId);
        await db.query(
          `insert into "user" (id, name, email) values ($1, 'Test', $1 || '@example.test')`,
          [userId],
        );
        await db.query(
          `insert into session (id, token, user_id, created_at, updated_at, expires_at)
           values ($1, $2, $3, $4, now(), now() + interval '1 day')`,
          [randomUUID(), token, userId, new Date(Date.now() - age)],
        );
        const { rows } = await db.query(
          `insert into profiles (user_id) values ($1) returning id`,
          [userId],
        );
        const signature = createHmac("sha256", BETTER_AUTH_SECRET)
          .update(token)
          .digest("base64");
        await context.addCookies([
          {
            name: "better-auth.session_token",
            value: encodeURIComponent(`${token}.${signature}`),
            url: test.info().project.use.baseURL,
          },
        ]);
        return { userId, profileId: rows[0].id };
      },
    });

    await db.query(`delete from "user" where id = any($1)`, [users]);
    await db.end();
  },
});

const taskOf = new Map(allTasks.map((t) => [t.id, t]));

export function seedAttempt(
  db: Client,
  profileId: string,
  taskId: string,
  correct: boolean,
  hoursAgo = 0,
) {
  const task = taskOf.get(taskId);
  if (!task) throw new Error(`unknown task ${taskId}`);
  return db.query(
    `with session as (
       insert into task_sessions (profile_id, task_id, kind, started_at, last_seen_at)
       values ($1, $2, 'first', now() - $4::int * interval '1 hour' - interval '1 second',
         now() - $4::int * interval '1 hour')
       returning id
     )
     insert into attempts (profile_id, task_id, session_id, answers, outcomes, correct,
       difficulty, key_rev, checker, created_at)
     select $1, $2, id, '{1}', array[case when $3 then 'right' else 'wrong' end]::part_outcome[], $3,
       $5, $6, 1, now() - $4::int * interval '1 hour'
     from session`,
    [profileId, taskId, correct, hoursAgo, task.difficulty, task.keyRev],
  );
}

export async function answer(page: Page, value: string) {
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = page.locator("math-field").first();
  await field.click();
  await field.pressSequentially(value);
}

export const mathKeys = (page: Page) =>
  page.locator(".ML__keyboard.is-visible .MLK__layer.is-visible");

export async function finish(page: Page) {
  await page.getByRole("button", { name: /^Završi( test)?$/ }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Završi test" })
    .click();
}

export const noId = "00000000-0000-0000-0000-000000000000";

const recorder = process.env.ANALYTICS_CLICKHOUSE_URL;

export const needsRecorder = () =>
  test.skip(
    !recorder,
    "needs ANALYTICS_CLICKHOUSE_URL pointing at the recorder",
  );

export const rows = async (match: (row: Row) => boolean) =>
  ((await (await fetch(`${recorder}/rows`)).json()) as Row[]).filter(match);

export const aidOf = async (page: Page) =>
  (await page.context().cookies()).find(({ name }) => name === "aid")?.value;

export async function recorded(page: Page, name: string) {
  const aid = await aidOf(page);
  return rows((row) => row.aid === aid && row.name === name);
}

export const propsOf = async (page: Page, name: string) =>
  (await recorded(page, name)).map(({ props }) => props);

export const flush = (page: Page) =>
  page.evaluate(() => dispatchEvent(new Event("pagehide")));

export const hydrated = (page: Page) =>
  page.waitForFunction(() =>
    Array.from(document.querySelectorAll("main select, main a")).every(
      (field) =>
        Object.keys(field).some((key) => key.startsWith("__reactProps")),
    ),
  );
