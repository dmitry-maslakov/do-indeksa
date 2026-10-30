import { randomUUID } from "node:crypto";
import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

interface Row {
  name: string;
  aid: string;
  route: string;
  locale: string;
  bot: boolean;
  utm_campaign: string;
  props: Record<string, unknown>;
}

const recorder = process.env.ANALYTICS_CLICKHOUSE_URL;

test.skip(!recorder, "needs ANALYTICS_CLICKHOUSE_URL pointing at the recorder");

const rows = async (match: (row: Row) => boolean) =>
  ((await (await fetch(`${recorder}/rows`)).json()) as Row[]).filter(match);

const visitOf = async (campaign: string) =>
  (await rows((row) => row.utm_campaign === campaign))
    .map(({ name }) => name)
    .filter((name) => name !== "web_vital")
    .toSorted();

const cookie = async (context: BrowserContext, name: string) =>
  (await context.cookies()).find((c) => c.name === name)?.value;

const flush = (page: Page) =>
  page.evaluate(() => dispatchEvent(new Event("pagehide")));

test("a first visit records the visit and the page", async ({ page }) => {
  const campaign = randomUUID();
  await page.goto(`/bank?utm_source=e2e&utm_campaign=${campaign}`);
  await expect
    .poll(() => visitOf(campaign))
    .toEqual(["page_view", "visit_started"]);
  const aid = await cookie(page.context(), "aid");
  const [visit] = await rows(
    (row) => row.utm_campaign === campaign && row.name === "visit_started",
  );
  expect(visit).toMatchObject({
    aid,
    route: "/bank",
    locale: "sr-Latn",
    bot: false,
    props: { first_visit: true },
  });
  await expect(page).toHaveURL(/\/bank$/);

  await page.getByRole("banner").getByRole("link", { name: "Teorija" }).click();
  await expect(page).toHaveURL(/\/theory$/);
  await flush(page);
  await expect
    .poll(async () =>
      (await rows((row) => row.aid === aid && row.route === "/theory")).map(
        ({ name, props }) => [name, props.nav],
      ),
    )
    .toContainEqual(["page_view", "push"]);
  await expect
    .poll(async () =>
      (await rows((row) => row.aid === aid && row.name === "web_vital")).map(
        ({ route }) => route,
      ),
    )
    .toContain("/bank");
});

test("a missing page records error_shown", async ({ page }) => {
  await page.goto("/bank/nema-zadatka");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const aid = await cookie(page.context(), "aid");
  await expect
    .poll(async () => {
      await flush(page);
      return (await rows((row) => row.aid === aid)).map(({ name, props }) => [
        name,
        props.path,
      ]);
    })
    .toContainEqual(["error_shown", "/bank/nema-zadatka"]);
});

test("a crawler is marked as a bot", async ({ browser }) => {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  });
  const campaign = randomUUID();
  await (await context.newPage()).goto(`/theory?utm_campaign=${campaign}`);
  await expect
    .poll(() => visitOf(campaign))
    .toEqual(["page_view", "visit_started"]);
  const recorded = await rows((row) => row.utm_campaign === campaign);
  expect(recorded.every(({ bot }) => bot)).toBe(true);
  await context.close();
});

test("after opting out nothing is recorded", async ({ page, browser }) => {
  await page.goto("/privacy");
  await page.getByRole("button", { name: "Isključi analitiku" }).click();
  await expect(
    page.getByRole("button", { name: "Uključi analitiku" }),
  ).toBeVisible();
  await expect.poll(() => cookie(page.context(), "analytics")).toBe("off");
  expect(await cookie(page.context(), "aid")).toBeUndefined();

  const campaign = randomUUID();
  const control = await browser.newContext();
  await (await control.newPage()).goto(
    `/bank?utm_campaign=${campaign}-control`,
  );
  await page.goto(`/bank?utm_campaign=${campaign}`);
  await flush(page);
  await expect
    .poll(() => visitOf(`${campaign}-control`))
    .toEqual(["page_view", "visit_started"]);
  expect(await rows((row) => row.utm_campaign === campaign)).toEqual([]);
  expect(await cookie(page.context(), "aid")).toBeUndefined();
  await control.close();

  await page.goto("/privacy");
  await page.getByRole("button", { name: "Uključi analitiku" }).click();
  await expect(
    page.getByRole("button", { name: "Isključi analitiku" }),
  ).toBeVisible();
  await expect.poll(() => cookie(page.context(), "aid")).toBeDefined();
});
