import { createHmac, randomInt, randomUUID } from "node:crypto";
import { test as base, type Page } from "@playwright/test";
import { Client } from "pg";

export { expect } from "@playwright/test";

const { DATABASE_URL, BETTER_AUTH_SECRET = "" } = process.env;

interface Auth {
  db: Client;
  signIn: (age?: number) => Promise<string>;
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
        return userId;
      },
    });

    await db.query(`delete from "user" where id = any($1)`, [users]);
    await db.end();
  },
});

export async function answer(page: Page, value: string) {
  await page.waitForFunction(() => customElements.get("math-field"));
  const field = page.locator("math-field").first();
  await field.click();
  await field.pressSequentially(value);
}

export async function finish(page: Page) {
  await page.getByRole("button", { name: "Završi test" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Završi test" })
    .click();
}
