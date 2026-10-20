import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const params = (page: Page) =>
  Object.fromEntries(new URL(page.url()).searchParams);

const hydrated = (page: Page) =>
  page.waitForFunction(() =>
    Array.from(document.querySelectorAll("main select, main input")).every(
      (field) =>
        Object.keys(field).some((key) => key.startsWith("__reactProps")),
    ),
  );

async function open(page: Page, path = "/bank") {
  await page.goto(path);
  await hydrated(page);
}

async function reload(page: Page) {
  await page.reload();
  await hydrated(page);
}

function bank(page: Page) {
  return {
    topic: page.getByRole("combobox", { name: "Tema", exact: true }),
    level: page.getByRole("combobox", { name: "Težina", exact: true }),
    source: page.getByRole("combobox", { name: "Izvor", exact: true }),
    search: page.getByRole("searchbox"),
    cards: page.locator("main article"),
    links: page.locator("main article a"),
    count: page.getByText(/^\d+(\.\d{3})* zadat(ak|ka|aka)$/),
    empty: page.getByText("Nema zadataka za ove filtere."),
  };
}

test("the bank keeps topic, source and level in the URL", async ({
  page,
  errors,
}) => {
  await open(page);
  const { topic, level, source, cards } = bank(page);
  await expect(cards.first().locator("[data-slot=skeleton]")).toHaveCount(0);
  const first = await cards.first().textContent();

  await topic.selectOption({ label: "Logaritmi" });
  await expect.poll(() => params(page)).toEqual({ topic: "logarithms" });
  await expect(cards.first()).toContainText("Logaritmi");
  await expect(cards.filter({ hasNotText: "Logaritmi" })).toHaveCount(0);

  await level.selectOption({ label: "lako" });
  await expect
    .poll(() => params(page))
    .toEqual({ topic: "logarithms", level: "easy" });
  await expect(cards.filter({ hasNotText: "lako" })).toHaveCount(0);

  await source.selectOption({ label: "Do indeksa" });
  await expect
    .poll(() => params(page))
    .toEqual({ topic: "logarithms", level: "easy", source: "ours" });
  await expect(cards.filter({ hasNotText: "Do indeksa" })).toHaveCount(0);

  await reload(page);
  await expect(topic).toHaveValue("logarithms");
  await expect(level).toHaveValue("easy");
  await expect(source).toHaveValue("ours");

  await topic.selectOption({ label: "Sve teme" });
  await level.selectOption({ label: "Bilo koja" });
  await source.selectOption({ label: "Svi" });
  await expect.poll(() => params(page)).toEqual({});
  await expect(cards.first()).toHaveText(first ?? "");
  expect(errors).toEqual([]);
});

test("the bank searches while typing and keeps the query in the URL", async ({
  page,
  errors,
}) => {
  await open(page);
  const { search, cards, empty, count } = bank(page);
  const all = await count.textContent();

  await search.fill("nema-takve-reci");
  await expect.poll(() => params(page)).toEqual({ q: "nema-takve-reci" });
  await expect(empty).toBeVisible();
  await expect(cards).toHaveCount(0);

  await search.fill("jednacinu");
  await expect.poll(() => params(page)).toEqual({ q: "jednacinu" });
  await expect(empty).toBeHidden();
  await expect(cards.first()).toBeVisible();

  await reload(page);
  await expect(search).toHaveValue("jednacinu");

  await page.getByRole("link", { name: "Poništi filtere" }).click();
  await expect.poll(() => params(page)).toEqual({});
  await expect(search).toHaveValue("");
  await expect(count).toHaveText(all ?? "");
  expect(errors).toEqual([]);
});

test("a task opens from the filtered list", async ({ page, errors }) => {
  await open(page, "/bank?topic=logarithms&level=easy");
  const { links } = bank(page);
  await expect(links.first()).toHaveAttribute("href", /\/bank\/[\w-]+$/);

  await links.first().click();
  await expect(page).toHaveURL(/\/bank\/[\w-]+$/);
  expect(errors).toEqual([]);
});

test("back and forward restore the bank filters", async ({ page }) => {
  await open(page);
  const { topic, level, search, cards, empty } = bank(page);
  await expect(cards.first()).toBeVisible();

  await topic.selectOption({ label: "Logaritmi" });
  await expect.poll(() => params(page)).toEqual({ topic: "logarithms" });
  await level.selectOption({ label: "lako" });
  await expect
    .poll(() => params(page))
    .toEqual({ topic: "logarithms", level: "easy" });
  await search.fill("nema-takve-reci");
  await expect(empty).toBeVisible();

  await page.goBack();
  await expect
    .poll(() => params(page))
    .toEqual({ topic: "logarithms", level: "easy" });
  await expect(search).toHaveValue("");
  await expect(empty).toBeHidden();
  await expect(cards.first()).toContainText("lako");

  await page.goBack();
  await expect.poll(() => params(page)).toEqual({ topic: "logarithms" });
  await expect(level).toHaveValue("");
  await expect(topic).toHaveValue("logarithms");

  await page.goBack();
  await expect.poll(() => params(page)).toEqual({});
  await expect(topic).toHaveValue("");

  await page.goForward();
  await page.goForward();
  await page.goForward();
  await expect
    .poll(() => params(page))
    .toEqual({ topic: "logarithms", level: "easy", q: "nema-takve-reci" });
  await expect(topic).toHaveValue("logarithms");
  await expect(level).toHaveValue("easy");
  await expect(search).toHaveValue("nema-takve-reci");
  await expect(empty).toBeVisible();
});

test("the bank ignores filters it does not know", async ({ page, errors }) => {
  await page.goto("/bank");
  const { topic, level, source, search, count } = bank(page);
  const all = await count.textContent();

  await page.goto(
    "/bank?level=bogus&source=book&sort=up&number=-1&topic=&q=%20",
  );
  await expect(count).toHaveText(all ?? "");
  await expect(level).toHaveValue("");
  await expect(source).toHaveValue("");
  await expect(topic).toHaveValue("");
  await expect(search).toHaveValue("");
  expect(errors).toEqual([]);
});

test("a signed-in user filters the bank by status", async ({ page, auth }) => {
  await auth.signIn();
  await open(page);
  const { cards, empty } = bank(page);
  const status = page.getByRole("combobox", { name: "Moj status" });
  await expect(cards.first()).toBeVisible();

  await status.selectOption({ label: "Tačno rešeni" });
  await expect.poll(() => params(page)).toEqual({ status: "solved" });
  await expect(empty).toBeVisible();

  await status.selectOption({ label: "Nerešeni" });
  await expect.poll(() => params(page)).toEqual({ status: "new" });
  await expect(cards.first()).toBeVisible();
  await expect(empty).toBeHidden();
});

test("the bank feed loads the next page while scrolling", async ({
  page,
  errors,
}) => {
  await open(page);
  const { count, cards, links } = bank(page);
  const total = Number((await count.textContent())?.replace(/\D/g, ""));
  test.skip(total <= 30, "the bank fits on one page");
  await expect(cards).toHaveCount(30);

  await page
    .getByRole("button", { name: "Prikaži još" })
    .scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(Math.min(total, 60));
  const hrefs = await links.evaluateAll((all) =>
    all.map((link) => link.getAttribute("href")),
  );
  expect(new Set(hrefs).size).toBe(hrefs.length);
  await expect(page).toHaveURL(/\/bank$/);
  expect(errors).toEqual([]);
});

test("the bank filters open in a sheet on a phone @mobile", async ({
  page,
  errors,
}) => {
  await open(page);
  const { topic, count } = bank(page);
  await expect(topic).toBeHidden();

  await page.getByRole("button", { name: "Filteri", exact: true }).click();
  await topic.selectOption({ label: "Logaritmi" });
  await expect.poll(() => params(page)).toEqual({ topic: "logarithms" });
  const shown = page.getByRole("button", { name: /^Prikaži / });
  await expect(async () =>
    expect(await shown.textContent()).toBe(
      `Prikaži ${await count.textContent()}`,
    ),
  ).toPass();
  await shown.click();
  await expect(topic).toBeHidden();
  await expect(page.getByRole("button", { name: "Filteri · 1" })).toBeVisible();
  await expect(
    page.getByText("Logaritmi", { exact: true }).filter({ visible: true }),
  ).not.toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the bank feed rejects a malformed page request", async ({ request }) => {
  const page = await request.get("/api/bank?offset=-1&locale=xx");
  expect(page.status()).toBe(400);
});
