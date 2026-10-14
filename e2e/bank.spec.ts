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

async function open(page: Page) {
  await page.goto("/bank");
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
    sort: page.getByRole("combobox", { name: "Redosled", exact: true }),
    search: page.getByRole("searchbox"),
    cards: page.getByRole("link").filter({ hasText: "na ispitu" }),
    count: page.getByText(/^\d+ zadat(ak|ka|aka)$/),
    empty: page.getByText("Ništa nije pronađeno"),
  };
}

test("the bank keeps topic, level and sort in the URL", async ({
  page,
  errors,
}) => {
  await open(page);
  const { topic, level, sort, cards } = bank(page);
  await expect(cards.first()).toContainText("Zadatak 1 na ispitu");

  await topic.selectOption({ label: "Logaritmi" });
  await expect.poll(() => params(page)).toEqual({ topic: "logarithms" });
  await expect(cards.first()).toContainText("Logaritmi");
  await expect(cards.filter({ hasNotText: "Logaritmi" })).toHaveCount(0);

  await level.selectOption({ label: "Lako" });
  await expect
    .poll(() => params(page))
    .toEqual({ topic: "logarithms", level: "easy" });
  await expect(cards.first()).toContainText("lako");
  await expect(cards.filter({ hasNotText: "lako" })).toHaveCount(0);

  await reload(page);
  await expect(topic).toHaveValue("logarithms");
  await expect(level).toHaveValue("easy");
  await expect(cards.filter({ hasNotText: "Logaritmi" })).toHaveCount(0);

  await topic.selectOption({ label: "Sve teme" });
  await level.selectOption({ label: "Bilo koji" });
  await expect.poll(() => params(page)).toEqual({});
  await expect(cards.first()).toContainText("Zadatak 1 na ispitu");

  await sort.selectOption({ label: "Prvo teži" });
  await expect.poll(() => params(page)).toEqual({ sort: "hard" });
  await expect(cards.first()).toContainText("teško");

  await sort.selectOption({ label: "Prvo lakši" });
  await expect.poll(() => params(page)).toEqual({ sort: "easy" });
  await expect(cards.first()).toContainText("lako");

  await sort.selectOption({ label: "Po broju zadatka" });
  await expect.poll(() => params(page)).toEqual({});
  await expect(cards.first()).toContainText("Zadatak 1 na ispitu");
  expect(errors).toEqual([]);
});

test("the bank search runs on enter and lives in the URL", async ({
  page,
  errors,
}) => {
  await open(page);
  const { search, cards, empty, count } = bank(page);
  const all = await count.textContent();

  await search.fill("nema-takve-reci");
  await expect(page).toHaveURL(/\/bank$/);
  await search.press("Enter");
  await expect.poll(() => params(page)).toEqual({ q: "nema-takve-reci" });
  await expect(empty).toBeVisible();
  await expect(cards).toHaveCount(0);

  await search.fill("jednacinu");
  await search.press("Enter");
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

test("back and forward restore the bank filters", async ({ page }) => {
  await open(page);
  const { topic, level, search, cards, empty } = bank(page);
  await expect(cards.first()).toBeVisible();

  await topic.selectOption({ label: "Logaritmi" });
  await expect.poll(() => params(page)).toEqual({ topic: "logarithms" });
  await level.selectOption({ label: "Lako" });
  await expect
    .poll(() => params(page))
    .toEqual({ topic: "logarithms", level: "easy" });
  await search.fill("nema-takve-reci");
  await search.press("Enter");
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
  const { topic, level, sort, search, count } = bank(page);
  const all = await count.textContent();

  await page.goto("/bank?level=bogus&sort=up&number=-1&topic=&q=%20");
  await expect(count).toHaveText(all ?? "");
  await expect(level).toHaveValue("");
  await expect(sort).toHaveValue("");
  await expect(topic).toHaveValue("");
  await expect(search).toHaveValue("");
  expect(errors).toEqual([]);
});

test("a signed-in user filters the bank by status", async ({ page, auth }) => {
  await auth.signIn();
  await open(page);
  const { cards, empty } = bank(page);
  const status = page.getByRole("combobox", { name: "Status", exact: true });
  await expect(cards.first()).toBeVisible();

  await status.selectOption({ label: "Rešeni" });
  await expect.poll(() => params(page)).toEqual({ status: "solved" });
  await expect(empty).toBeVisible();

  await status.selectOption({ label: "Nerešeni" });
  await expect.poll(() => params(page)).toEqual({ status: "new" });
  await expect(cards.first()).toBeVisible();
  await expect(empty).toBeHidden();
});
