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
      ["Statistika", /\/stats$/],
    ] as const) {
      const link = nav.getByRole("link", { name });
      await link.click();
      await expect(page).toHaveURL(path);
      await expect(link).toHaveAttribute("aria-current", "page");
    }
  },
);

const routes = [
  "/",
  "/bank",
  "/bank/eks-001",
  "/variants",
  "/variants/set-eks-001",
  "/daily",
  "/review",
  "/stats",
  "/privacy",
];

async function fitsPhone(
  page: Page,
  errors: string[],
  path: string,
  account: string,
) {
  await page.goto(path);
  await expect(
    page
      .locator("[data-task-focus]")
      .or(page.getByRole("banner").getByRole("button", { name: account })),
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
