import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import proxy from "./proxy";

const rewrite = async (path: string) => {
  const response = await proxy(
    new NextRequest(new URL(path, "https://doindeksa.rs")),
  );
  return response.headers.get("x-middleware-rewrite") ?? "";
};

const missing = (locale: string) => `https://doindeksa.rs/${locale}/404`;

describe("proxy", () => {
  it.each([
    "/bank/eks-001",
    "/theory/exponential-equations",
    "/theory/exponential-equations/methods",
    "/theory/exponential-equations/methods/substitution",
    "/variants/ftn-p1-2025",
    "/variants/set-eks-001.log-001",
    "/bank/start/logarithms",
    "/bank",
    "/bank/topic/logarithms",
    "/ru/bank/topic/logarithms?level=easy",
    "/theory",
    "/variants",
    "/ru/theory/exponential-equations",
  ])("lets %s through", async (path) => {
    expect(await rewrite(path)).not.toMatch(/\/404$/);
  });

  it.each([
    ["/bank/nema-zadatka", "sr-Latn"],
    ["/theory/nema-teme", "sr-Latn"],
    ["/theory/nema-teme/methods", "sr-Latn"],
    ["/theory/exponential-equations/methods/nema-metoda", "sr-Latn"],
    ["/theory/nema-teme/methods/substitution", "sr-Latn"],
    ["/variants/nema-varijante", "sr-Latn"],
    ["/variants/set-eks-001.nema-zadatka", "sr-Latn"],
    ["/ru/theory/nema-teme", "ru"],
    ["/en/variants/nema-varijante", "en"],
    ["/sr-Latn/bank/nema-zadatka", "sr-Latn"],
    ["/bank/topic/nema-teme", "sr-Latn"],
    ["/en/bank/topic/nema-teme", "en"],
  ])("sends %s to the not found page", async (path, locale) => {
    expect(await rewrite(path)).toBe(missing(locale));
  });
});
