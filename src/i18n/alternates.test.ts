import { describe, expect, it } from "vitest";
import { alternates, untranslated } from "./alternates";

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

describe("untranslated", () => {
  it("indexes a page with Serbian content in Serbian alone", () => {
    expect(untranslated("/bank/eks-001", "sr-Latn")).toEqual({
      alternates: { canonical: "/bank/eks-001" },
    });
  });

  it("keeps the other locales of the page out of search", () => {
    expect(untranslated("/bank/eks-001", "en")).toEqual({
      alternates: { canonical: "/en/bank/eks-001" },
      robots: { index: false },
    });
  });
});
