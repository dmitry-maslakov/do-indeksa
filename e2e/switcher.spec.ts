import type { Page } from "@playwright/test";
import { allExams, allFaculties } from "content-collections";
import { sortBy } from "es-toolkit";
import en from "../messages/en.json";
import ru from "../messages/ru.json";
import sr from "../messages/sr-Latn.json";
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

const catalogs = [
  ["", sr],
  ["/ru", ru],
  ["/en", en],
] as const;

for (const signedIn of [false, true])
  test(`the header fits narrow phones ${signedIn ? "signed in" : "as a guest"}`, {
    tag: "@mobile",
  }, async ({ page, auth }) => {
    if (signedIn) await auth.signIn();
    for (const [locale, { UserMenu }] of catalogs) {
      await page.goto(at(`${locale}/bank`));
      const header = page.getByRole("banner");
      const switcher = header.getByRole("button", { name: pill });
      const account = signedIn
        ? header.getByRole("button", { name: UserMenu.account })
        : header.getByRole("button", { name: UserMenu.signIn });
      await expect(account).toBeVisible();
      if (!signedIn) await expect(account).toHaveText(UserMenu.signIn);

      for (const width of [360, 375, 390, 430]) {
        await page.setViewportSize({ width, height: 844 });
        const where = `${locale || "/sr-Latn"} ${width}px`;
        await expect(switcher, where).toHaveText(
          width < 400 ? exam.title : pill,
          { useInnerText: true },
        );
        const fit = await header.evaluate((root) => {
          const page = document.documentElement;
          const boxes = [...root.querySelectorAll("a, button")]
            .filter((el) => el.checkVisibility())
            .map((el) => ({
              rect: el.getBoundingClientRect(),
              clipped:
                el.scrollWidth > el.clientWidth ||
                el.scrollHeight > el.clientHeight,
            }));
          const sorted = boxes
            .map(({ rect }) => rect)
            .sort((a, b) => a.left - b.left);
          return {
            overflow: page.scrollWidth - page.clientWidth,
            left: Math.round(sorted[0]?.left ?? 0),
            right: Math.round(page.clientWidth - (sorted.at(-1)?.right ?? 0)),
            clipped: boxes.some((b) => b.clipped),
            overlap: sorted.some(
              (r, i) => i > 0 && r.left < (sorted[i - 1]?.right ?? 0),
            ),
          };
        });
        expect(fit, where).toEqual({
          overflow: 0,
          left: 16,
          right: 16,
          clipped: false,
          overlap: false,
        });
      }
    }
  });
