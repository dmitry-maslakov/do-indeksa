import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

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

    await page.goto("/review");
    await expect(nav.getByRole("link", { name: "Testovi" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
);

const routes = [
  "/",
  "/bank",
  "/bank/eks-001",
  "/variants",
  "/variants/set-eks-001",
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

test("the launch page shows only the logo and the language", {
  tag: "@responsive",
}, async ({ page, errors }) => {
  await fitsPhone(page, errors, "/launch", "Jezik");
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("link")).toHaveText(["do indeksa"]);
  await expect(banner.getByRole("button")).toHaveCount(1);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  expect(
    await page.evaluate(() => getComputedStyle(document.body).paddingBottom),
  ).toBe("0px");
});

test("the nav comes back after leaving a task on a phone", {
  tag: "@mobile",
}, async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
  await page.goto("/bank");
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
  await page.goto("/theory/exponential-equations");
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
