import { describe, expect, it } from "vitest";
import { alternates } from "./alternates";

describe("alternates", () => {
  it("links every locale of a page", () => {
    expect(alternates("/bank", "ru")).toEqual({
      canonical: "/ru/bank",
      languages: {
        "sr-Latn": "/bank",
        ru: "/ru/bank",
        en: "/en/bank",
        "x-default": "/bank",
      },
    });
  });

  it("prefixes only the other locales of the home page", () => {
    const { canonical, languages } = alternates("/", "en") ?? {};
    expect(canonical).toBe("/en");
    expect(languages).toMatchObject({ "sr-Latn": "/" });
  });
});
