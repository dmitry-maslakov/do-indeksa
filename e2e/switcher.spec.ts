import type { Page } from "@playwright/test";
import { allExams, allFaculties } from "content-collections";
import { sortBy } from "es-toolkit";
import { examCookie } from "../src/lib/cookies";
import { at, expect, test } from "./fixtures";

const [exam] = sortBy(
  allExams.filter((e) => e.open),
  ["order"],
);
const faculty = allFaculties.find((f) => f.id === exam?.faculty);
if (!exam || !faculty) throw new Error("no open exam");
const pill = `${faculty.short} · ${exam.title}`;

const cookieOf = async (page: Page) =>
  (await page.context().cookies()).find(({ name }) => name === examCookie)
    ?.value;

const openList = async (page: Page, phone: boolean, name: string) => {
  await page.getByRole("banner").getByRole("button", { name: pill }).click();
  return page.getByRole(phone ? "dialog" : "menu", { name });
};

test(
  "the exam switcher opens the chosen exam and remembers it",
  { tag: "@responsive" },
  async ({ page, errors }, { project }) => {
    const phone = project.name === "mobile";
    await page.goto(at("/bank"));
    await expect.poll(() => cookieOf(page)).toBe(exam.id);
    await page.evaluate(
      (name) => cookieStore.set({ name, value: "stale", path: "/" }),
      examCookie,
    );
    expect(await cookieOf(page)).toBe("stale");

    const list = await openList(page, phone, "Ispit");
    await expect(list).toBeVisible();
    await expect(
      list.getByText(`${faculty.short} · ${faculty.city}`),
    ).toBeVisible();
    await expect(
      list
        .getByRole("link", { name: "Svi ispiti" })
        .or(list.getByRole("menuitem", { name: "Svi ispiti" })),
    ).toHaveAttribute("href", "/?pick=1");

    const current = phone
      ? list.getByRole("link", { name: exam.name })
      : list.getByRole("menuitemradio", { name: exam.name });
    await expect(current).toHaveAttribute(
      phone ? "aria-current" : "aria-checked",
      "true",
    );
    await current.click();

    await expect(page).toHaveURL(new RegExp(`${exam.path}$`));
    await expect(list).toBeHidden();
    expect(await cookieOf(page)).toBe(exam.id);
    expect(errors).toEqual([]);
  },
);

test(
  "the switcher keeps its labels in other languages",
  { tag: "@responsive" },
  async ({ page }, { project }) => {
    await page.goto(at("/en"));
    const list = await openList(page, project.name === "mobile", "Exam");
    await expect(
      list.getByRole("link", { name: exam.label?.en ?? exam.name }).or(
        list.getByRole("menuitemradio", {
          name: exam.label?.en ?? exam.name,
        }),
      ),
    ).toHaveAttribute("href", `/en${exam.path}`);
    await expect(
      list
        .getByRole("link", { name: "All exams" })
        .or(list.getByRole("menuitem", { name: "All exams" })),
    ).toHaveAttribute("href", "/en?pick=1");
  },
);
