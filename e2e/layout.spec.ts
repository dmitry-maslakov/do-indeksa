import type { Page } from "@playwright/test";
import { at, expect, test } from "./fixtures";

test(
  "the main navigation follows the breakpoint",
  { tag: "@responsive" },
  async ({ page }, { project }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
    await expect(nav).toHaveCount(1);
    await expect(page.getByRole("banner").getByRole("navigation")).toHaveCount(
      project.name === "mobile" ? 0 : 1,
    );
    await expect(nav.getByRole("link", { name: "Početna" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    for (const [name, path] of [
      ["Zadaci", /\/bank$/],
      ["Testovi", /\/variants$/],
      ["Teorija", /\/theory$/],
    ] as const) {
      const link = nav.getByRole("link", { name });
      await link.click();
      await expect(page).toHaveURL(path);
      await expect(link).toHaveAttribute("aria-current", "page");
    }

    await page.goto(at("/review"));
    await expect(nav.getByRole("link", { name: "Testovi" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
);

for (const path of ["/variants/ftn-p1-2025/solutions", "/bank/eks-001"])
  test(`${path} scrolls its formulas only sideways`, async ({ page }) => {
    await page.goto(path);
    const texts = page.locator("main div.math-text");
    await expect(texts.first()).toBeVisible();
    const scrolls = await texts.evaluateAll((all) =>
      all.map((text) => getComputedStyle(text).overflowY),
    );
    expect(new Set(scrolls)).toEqual(new Set(["hidden"]));
  });

const routes = [
  "/",
  "/bank",
  "/bank/eks-001",
  "/variants",
  "/variants/set-eks-001",
  "/variants/ftn-p1-2025/solutions",
  "/review",
  "/stats",
  "/privacy",
  "/terms",
  "/theory",
  "/theory/exponential-equations",
  "/theory/exponential-equations/methods",
  "/theory/exponential-equations/methods/substitution",
];

async function fitsPhone(
  page: Page,
  errors: string[],
  path: string,
  account: string,
) {
  await page.goto(path);
  await expect(
    /^\/(bank|theory|variants)\//.test(path)
      ? page.getByRole("main")
      : page.getByRole("banner").getByRole("button", { name: account }),
  ).toBeVisible();
  await page.waitForFunction(
    () => !document.querySelector("math-field:not(:defined)"),
  );

  for (const width of [390, 375, 360]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
      `${width}px`,
    ).toBe(0);
  }
  expect(errors).toEqual([]);
}

for (const path of routes) {
  test(`${path} fits a guest phone`, { tag: "@mobile" }, ({ page, errors }) =>
    fitsPhone(page, errors, path, "Prijavi se"),
  );

  test(`${path} fits a signed-in phone`, { tag: "@mobile" }, async ({
    page,
    auth,
    errors,
  }) => {
    await auth.signIn();
    await fitsPhone(page, errors, path, "Nalog");
  });
}

test("the nav comes back after leaving a task on a phone", {
  tag: "@mobile",
}, async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
  await page.goto(at("/bank"));
  await page.getByRole("link", { name: "Preporučeno" }).first().click();
  await expect(page).toHaveURL(/\/bank\/(?!start\/)[\w-]+$/);
  await expect(nav).toBeHidden();
  await expect(page.getByRole("banner")).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/bank$/);
  await expect(nav).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
});

test("a theory topic keeps only the bottom bar on a phone", {
  tag: "@mobile",
}, async ({ page }) => {
  await page.goto(at("/theory/exponential-equations"));
  await expect(
    page.getByRole("main").getByRole("link", { name: "Teorija" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("banner")).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Glavna navigacija" }),
  ).toBeVisible();
});

test.describe("before scripts run", () => {
  test.use({ javaScriptEnabled: false });

  test("a phone gets each page's chrome from the server", {
    tag: "@mobile",
  }, async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
    for (const [path, header, bottom] of [
      ["/bank", true, true],
      ["/bank/eks-001", false, false],
      ["/theory/exponential-equations", false, true],
      ["/variants/ftn-p1-2025", false, false],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("banner"), path).toBeVisible({
        visible: header,
      });
      await expect(nav, path).toBeVisible({ visible: bottom });
    }
  });
});
