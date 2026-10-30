import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { routeOf, routeTemplates } from "./routes";

describe("routeOf", () => {
  it.each([
    ["/", "sr-Latn", "/"],
    ["/ru", "ru", "/"],
    ["/bank/eks-001", "sr-Latn", "/bank/[id]"],
    ["/en/theory/logarithms/methods", "en", "/theory/[topic]/methods"],
    ["/variants/compose", "sr-Latn", "/variants/compose"],
    ["/variants/ftn-p1-2025", "sr-Latn", "/variants/[id]"],
    ["/rush", "sr-Latn", "/[...rest]"],
    ["/wp-admin/setup.php", "sr-Latn", "/[...rest]"],
  ])("maps %s", (pathname, locale, route) => {
    expect(routeOf(pathname)).toMatchObject({ locale, route });
  });

  it("returns the params of a dynamic route", () => {
    expect(routeOf("/theory/logarithms/methods/substitution").params).toEqual([
      "logarithms",
      "substitution",
    ]);
  });

  it("knows every page of the app", () => {
    const pages = globSync("**/page.tsx", { cwd: "src/app/[locale]" })
      .map(
        (file) =>
          `/${file
            .split("/")
            .slice(0, -1)
            .filter((segment) => !/^\(.*\)$/.test(segment))
            .join("/")}`,
      )
      .filter((route) => route !== "/[...rest]");
    expect(pages.toSorted()).toEqual([...routeTemplates].toSorted());
  });
});
