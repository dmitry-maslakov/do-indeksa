import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const at = (page: Page) => {
  const { pathname, searchParams } = new URL(page.url());
  return { path: pathname, ...Object.fromEntries(searchParams) };
};

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
  const cards = page.locator("main article").filter({ visible: true });
  return {
    topic: page.getByRole("combobox", { name: "Tema", exact: true }),
    level: page.getByRole("combobox", { name: "Težina", exact: true }),
    source: page.getByRole("combobox", { name: "Izvor", exact: true }),
    search: page.getByRole("searchbox"),
    cards,
    links: cards.locator("a"),
    count: page
      .getByText(/^\d+(\.\d{3})* zadat(ak|ka|aka)$/)
      .filter({ visible: true }),
    empty: page
      .getByText("Nema zadataka za ove filtere.")
      .filter({ visible: true }),
  };
}

const firstBankFrame = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ cards: string[]; placeholders: number }>((resolve) => {
        const shown = (selector: string) =>
          Array.from(document.querySelectorAll(selector)).filter((node) =>
            node.checkVisibility(),
          );
        const frame = () => {
          if (shown("main input[type=search]").length)
            resolve({
              cards: shown("main article").map(
                (card) => card.textContent ?? "",
              ),
              placeholders: shown("main [data-slot=skeleton]").length,
            });
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );

test("the bank keeps topic, source and level in the URL", async ({
  page,
  errors,
}) => {
  await open(page);
  const { topic, level, source, cards } = bank(page);
  const first = await cards.first().textContent();

  await topic.selectOption({ label: "Logaritmi" });
  await expect.poll(() => at(page)).toEqual({ path: "/bank/topic/logarithms" });
  await expect(cards.first()).toContainText("Logaritmi");
  await expect(cards.filter({ hasNotText: "Logaritmi" })).toHaveCount(0);

  await level.selectOption({ label: "lako" });
  await expect
    .poll(() => at(page))
    .toEqual({ path: "/bank/topic/logarithms", level: "easy" });
  await expect(cards.filter({ hasNotText: "lako" })).toHaveCount(0);

  await source.selectOption({ label: "Do indeksa" });
  await expect
    .poll(() => at(page))
    .toEqual({ path: "/bank/topic/logarithms", level: "easy", source: "ours" });
  await expect(cards.filter({ hasNotText: "Do indeksa" })).toHaveCount(0);

  await reload(page);
  await expect(topic).toHaveValue("logarithms");
  await expect(level).toHaveValue("easy");
  await expect(source).toHaveValue("ours");

  await topic.selectOption({ label: "Sve teme" });
  await expect
    .poll(() => at(page))
    .toEqual({ path: "/bank", level: "easy", source: "ours" });
  await expect(level).toHaveValue("easy");
  await level.selectOption({ label: "Bilo koja" });
  await source.selectOption({ label: "Svi" });
  await expect.poll(() => at(page)).toEqual({ path: "/bank" });
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
  await expect
    .poll(() => at(page))
    .toEqual({ path: "/bank", q: "nema-takve-reci" });
  await expect(empty).toBeVisible();
  await expect(cards).toHaveCount(0);

  await search.fill("jednacinu");
  await expect.poll(() => at(page)).toEqual({ path: "/bank", q: "jednacinu" });
  await expect(empty).toBeHidden();
  await expect(cards.first()).toBeVisible();

  await reload(page);
  await expect(search).toHaveValue("jednacinu");

  await page.getByRole("link", { name: "Poništi filtere" }).click();
  await expect.poll(() => at(page)).toEqual({ path: "/bank" });
  await expect(search).toHaveValue("");
  await expect(count).toHaveText(all ?? "");
  expect(errors).toEqual([]);
});

test("a click anywhere on a card opens its task", async ({ page }) => {
  await open(page, "/bank/topic/logarithms");
  const { cards, links } = bank(page);
  const href = await links.first().getAttribute("href");
  await cards.first().click({ position: { x: 12, y: 12 } });
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test("a task opens from the filtered list", async ({ page, errors }) => {
  await open(page, "/bank/topic/logarithms?level=easy");
  const { links } = bank(page);
  await expect(links.first()).toHaveAttribute("href", /\/bank\/[\w-]+$/);

  await links.first().click();
  await expect(page).toHaveURL(/\/bank\/[\w-]+$/);
  expect(errors).toEqual([]);
});

test("going back from a task shows the topic's cards at once", async ({
  page,
  errors,
}) => {
  await open(page, "/bank/topic/logarithms");
  const { cards, links } = bank(page);
  await links.first().click();
  await expect(page).toHaveURL(/\/bank\/[\w-]+$/);

  const first = firstBankFrame(page);
  await page.goBack();
  const { cards: shown } = await first;
  expect(shown.length).toBeGreaterThan(0);
  for (const card of shown) expect(card).toContain("Logaritmi");
  await expect(page).toHaveURL(/\/bank\/topic\/logarithms$/);
  await expect(cards.first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Svi zadaci opens the topic's list with its tabs and count in place", async ({
  page,
  errors,
}) => {
  await open(page, "/bank/log-001");
  const first = firstBankFrame(page);
  await page.getByRole("link", { name: "Svi zadaci" }).first().click();
  const { cards, placeholders } = await first;
  expect(cards.length).toBeGreaterThan(0);
  expect(placeholders).toBe(0);
  await expect(page).toHaveURL(/\/bank\/topic\/logarithms$/);
  expect(errors).toEqual([]);
});

test("Svi zadaci from Preporučeno goes back to the list the student left", async ({
  page,
  errors,
}) => {
  const all = page.getByRole("complementary").getByRole("link", {
    name: "Svi zadaci",
  });
  await page.goto("/bank");
  await page.getByRole("link", { name: "Preporučeno" }).first().click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await expect(all).toHaveAttribute("href", /\/bank$/);
  await all.click();
  await expect(page).toHaveURL(/\/bank$/);

  await page.goto("/bank/topic/logarithms?level=easy");
  await page.getByRole("link", { name: "Preporučeno" }).first().click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/|topic\/)[\w-]+$/);
  await expect(all).toHaveAttribute(
    "href",
    /\/bank\/topic\/logarithms\?level=easy$/,
  );
  await all.click();
  await expect(page).toHaveURL(/\/bank\/topic\/logarithms\?level=easy$/);
  expect(errors).toEqual([]);
});

test("Zadaci and Svi zadaci keep the student's filters", async ({
  page,
  errors,
}) => {
  const { topic, level, links } = bank(page);
  const list = /\/bank\/topic\/logarithms\?level=easy$/;
  const zadaci = page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Zadaci" });
  const backToList = async (link: Locator) => {
    await expect(link).toHaveAttribute("href", list);
    await link.click();
    await expect(page).toHaveURL(list);
  };

  await open(page);
  await topic.selectOption({ label: "Logaritmi" });
  await expect(page).toHaveURL(/\/bank\/topic\/logarithms$/);
  await level.selectOption({ label: "lako" });
  await backToList(zadaci);
  await backToList(
    page.getByRole("complementary").getByRole("link", { name: "Svi zadaci" }),
  );

  await links.first().click();
  await expect(page).toHaveURL(/\/bank\/(?!topic\/)[\w-]+$/);
  await backToList(zadaci);

  await page.getByRole("link", { name: "Preporučeno" }).first().click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/|topic\/)[\w-]+$/);
  await backToList(zadaci);

  await page.goto("/");
  await backToList(zadaci);
  expect(errors).toEqual([]);
});

test("an old topic link moves to the topic page", async ({ request }) => {
  const response = await request.get("/ru/bank?topic=logarithms&level=easy", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(
    /\/ru\/bank\/topic\/logarithms\?level=easy$/,
  );
});

test.describe("before scripts run", () => {
  test.use({ javaScriptEnabled: false });

  test("a topic page arrives with its first cards", async ({ page }) => {
    await page.goto("/bank/topic/logarithms");
    const { cards } = bank(page);
    await expect(cards.first()).toBeVisible();
    await expect(cards.filter({ hasNotText: "Logaritmi" })).toHaveCount(0);
    await expect(bank(page).topic.first()).toHaveValue("logarithms");
  });

  test("a topic links every one of its tasks through its pages", async ({
    page,
  }) => {
    const { long, more } = await longTopic(page);
    test.skip(!long, "every topic fits on its first page");
    const total = Number(
      (await bank(page).count.first().textContent())?.replace(/\D/g, ""),
    );
    const tasks = new Set(await taskLinks(page));
    for (let n = 2; (await more.count()) > 0; n++) {
      const path = `/bank/topic/${long}/${n}`;
      await expect(more).toHaveAttribute("href", path);
      await more.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page).toHaveTitle(new RegExp(`, strana ${n} · `));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${path}$`),
      );
      for (const href of await taskLinks(page)) tasks.add(href);
    }
    expect(tasks.size).toBe(total);
  });
});

async function longTopic(page: Page) {
  await page.goto("/bank");
  const topics = await bank(page)
    .topic.first()
    .locator("option")
    .evaluateAll((options) =>
      options.map((option) => option.getAttribute("value")).filter(Boolean),
    );
  const more = page.getByRole("button", { name: "Prikaži još" });
  for (const topic of topics) {
    await page.goto(`/bank/topic/${topic}`);
    if ((await more.count()) > 0) return { long: topic, more };
  }
  return { long: undefined, more };
}

const taskLinks = (page: Page) =>
  bank(page).links.evaluateAll((links) =>
    links.map((link) => link.getAttribute("href") ?? ""),
  );

test("the next page of a topic loads in place and keeps the filters on its topic", async ({
  page,
  errors,
}) => {
  const { long } = await longTopic(page);
  test.skip(!long, "every topic fits on its first page");
  await open(page, `/bank/topic/${long}`);
  const { cards, level } = bank(page);
  const shown = await cards.count();
  await page.getByRole("button", { name: "Prikaži još" }).click();
  await expect.poll(() => cards.count()).toBeGreaterThan(shown);
  await expect.poll(() => at(page)).toEqual({ path: `/bank/topic/${long}` });

  await open(page, `/bank/topic/${long}/2`);
  await expect(cards.first()).toBeVisible();
  await level.first().selectOption({ label: "lako" });
  await expect
    .poll(() => at(page))
    .toEqual({ path: `/bank/topic/${long}`, level: "easy" });
  expect(errors).toEqual([]);
});

test("back and forward restore the bank filters", async ({ page }) => {
  await open(page);
  const { topic, level, search, cards, empty } = bank(page);
  await expect(cards.first()).toBeVisible();

  await topic.selectOption({ label: "Logaritmi" });
  await expect.poll(() => at(page)).toEqual({ path: "/bank/topic/logarithms" });
  await level.selectOption({ label: "lako" });
  await expect
    .poll(() => at(page))
    .toEqual({ path: "/bank/topic/logarithms", level: "easy" });
  await search.fill("nema-takve-reci");
  await expect(empty).toBeVisible();

  await page.goBack();
  await expect
    .poll(() => at(page))
    .toEqual({ path: "/bank/topic/logarithms", level: "easy" });
  await expect(search).toHaveValue("");
  await expect(empty).toBeHidden();
  await expect(cards.first()).toContainText("lako");

  await page.goBack();
  await expect.poll(() => at(page)).toEqual({ path: "/bank/topic/logarithms" });
  await expect(level).toHaveValue("");
  await expect(topic).toHaveValue("logarithms");

  await page.goBack();
  await expect.poll(() => at(page)).toEqual({ path: "/bank" });
  await expect(topic).toHaveValue("");

  await page.goForward();
  await page.goForward();
  await page.goForward();
  await expect
    .poll(() => at(page))
    .toEqual({
      path: "/bank/topic/logarithms",
      level: "easy",
      q: "nema-takve-reci",
    });
  await expect(topic).toHaveValue("logarithms");
  await expect(level).toHaveValue("easy");
  await expect(search).toHaveValue("nema-takve-reci");
  await expect(empty).toBeVisible();
});

test("the bank ignores filters it does not know", async ({ page, errors }) => {
  await page.goto("/bank");
  const { topic, level, source, search, count } = bank(page);
  await expect(count).toHaveCount(1);
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
  await expect
    .poll(() => at(page))
    .toEqual({ path: "/bank", status: "solved" });
  await expect(empty).toBeVisible();

  await status.selectOption({ label: "Nerešeni" });
  await expect.poll(() => at(page)).toEqual({ path: "/bank", status: "new" });
  await expect(cards.first()).toBeVisible();
  await expect(empty).toBeHidden();
});

test("the bank feed loads more cards and keeps them after going back", async ({
  page,
  errors,
}) => {
  await open(page);
  const { count, cards, links } = bank(page);
  const total = Number((await count.textContent())?.replace(/\D/g, ""));
  test.skip(total <= 3, "the bank fits on the first page");
  await expect(cards).toHaveCount(Math.min(total, 13));

  await cards.last().scrollIntoViewIfNeeded();
  const loaded = Math.min(total, 23);
  await expect(cards).toHaveCount(loaded);
  const hrefs = await links.evaluateAll((all) =>
    all.map((link) => link.getAttribute("href")),
  );
  expect(new Set(hrefs).size).toBe(hrefs.length);
  await expect(page).toHaveURL(/\/bank$/);

  await links.last().click();
  await expect(page).toHaveURL(/\/bank\/[\w-]+$/);
  await page.goBack();
  await expect
    .poll(() => cards.filter({ visible: true }).count())
    .toBeGreaterThanOrEqual(loaded);
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
  await expect.poll(() => at(page)).toEqual({ path: "/bank/topic/logarithms" });
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

test("Preporučeno opens the recommended task of the topic", async ({
  page,
  errors,
}) => {
  await page.goto("/bank/topic/logarithms");
  await page.getByRole("link", { name: "Preporučeno" }).first().click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await expect(page.getByLabel("Tema").filter({ visible: true })).toHaveValue(
    "logarithms",
  );
  expect(errors).toEqual([]);
});
