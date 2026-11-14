import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { routeOf, routeTemplates } from "./routes";

describe("routeOf", () => {
  it.each([
    ["/", "sr-Latn", null, "/"],
    ["/ru", "ru", null, "/"],
    ["/privacy", "sr-Latn", null, "/privacy"],
    ["/ftn/p1", "sr-Latn", "/ftn/p1", "/"],
    ["/ftn/p1/bank/eks-001", "sr-Latn", "/ftn/p1", "/bank/[id]"],
    ["/ru/ftn/p1/about", "ru", "/ftn/p1", "/about"],
    [
      "/en/ftn/p1/theory/logarithms/methods",
      "en",
      "/ftn/p1",
      "/theory/[topic]/methods",
    ],
    ["/ftn/p1/variants/ftn-p1-2025", "sr-Latn", "/ftn/p1", "/variants/[id]"],
    ["/ftn/p1/bank/start/logarithms", "sr-Latn", "/ftn/p1", "/[...rest]"],
    ["/bank/eks-001", "sr-Latn", "/bank/eks-001", "/"],
    ["/ftn", "sr-Latn", null, "/[faculty]"],
    ["/ftn/programs/ra", "sr-Latn", null, "/[faculty]/programs/[slug]"],
    ["/wp-admin/setup.php", "sr-Latn", "/wp-admin/setup.php", "/"],
    ["/ftn/programs", "sr-Latn", "/ftn/programs", "/"],
    ["/ru/ftn/p1/bank/eks-001", "ru", "/ftn/p1", "/bank/[id]"],
    ["/RU/ftn/p1/bank", "ru", "/ftn/p1", "/bank"],
    ["/SR-LATN/privacy", "sr-Latn", null, "/privacy"],
    ["/a/b/c/d/e/f", "sr-Latn", "/a/b", "/[...rest]"],
  ])("maps %s", (pathname, locale, exam, route) => {
    expect(routeOf(pathname)).toMatchObject({ locale, exam, route });
  });

  it("returns the params of a dynamic route", () => {
    expect(
      routeOf("/ftn/p1/theory/logarithms/methods/substitution").params,
    ).toEqual(["logarithms", "substitution"]);
  });

  it("knows every page of the app", () => {
    const pages = globSync("**/page.tsx", { cwd: "src/app/[locale]" })
      .map(
        (file) =>
          `/${file
            .split("/")
            .slice(0, -1)
            .filter((segment) => !/^\(.*\)$/.test(segment))
            .join("/")}`.replace(/^\/\[faculty\]\/\[exam\]/, "") || "/",
      )
      .filter((route) => route !== "/[...rest]");
    expect(pages.toSorted()).toEqual([...routeTemplates].toSorted());
  });
});
