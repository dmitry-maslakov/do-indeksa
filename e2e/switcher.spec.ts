import type { Page } from "@playwright/test";
import { at, expect, test } from "./fixtures";

const examCookie = async (page: Page) =>
  (await page.context().cookies()).find(({ name }) => name === "__Host-exam")
    ?.value;

test(
  "the exam switcher opens the chosen exam and remembers it",
  { tag: "@responsive" },
  async ({ page, errors }, { project }) => {
    const phone = project.name === "mobile";
    await page.goto(at("/bank"));
    await expect.poll(() => examCookie(page)).toBe("ftn-p1");
    await page.evaluate(() =>
      cookieStore.set({ name: "__Host-exam", value: "ftn-p3", path: "/" }),
    );
    expect(await examCookie(page)).toBe("ftn-p3");

    await page
      .getByRole("banner")
      .getByRole("button", { name: "FTN · P1" })
      .click();
    const list = phone
      ? page.getByRole("dialog", { name: "Ispit" })
      : page.getByRole("menu", { name: "FTN · P1" });
    await expect(list).toBeVisible();
    await expect(list.getByText("FTN · Novi Sad")).toBeVisible();
    await expect(
      list
        .getByRole("link", { name: "Svi ispiti" })
        .or(list.getByRole("menuitem", { name: "Svi ispiti" })),
    ).toHaveAttribute("href", "/?pick=1");

    const current = phone
      ? list.getByRole("link", { name: "Matematika" })
      : list.getByRole("menuitemradio", { name: "Matematika" });
    await expect(current).toHaveAttribute(
      phone ? "aria-current" : "aria-checked",
      "true",
    );
    await current.click();

    await expect(page).toHaveURL(/\/ftn\/p1$/);
    await expect(list).toBeHidden();
    expect(await examCookie(page)).toBe("ftn-p1");
    expect(errors).toEqual([]);
  },
);

test("the switcher keeps its labels in other languages", async ({ page }) => {
  await page.goto(at("/en"));
  await page
    .getByRole("banner")
    .getByRole("button", { name: "FTN · P1" })
    .click();
  const menu = page.getByRole("menu", { name: "FTN · P1" });
  await expect(
    menu.getByRole("menuitemradio", { name: "Mathematics" }),
  ).toHaveAttribute("href", "/en/ftn/p1");
  await expect(
    menu.getByRole("menuitem", { name: "All exams" }),
  ).toHaveAttribute("href", "/en?pick=1");
});
