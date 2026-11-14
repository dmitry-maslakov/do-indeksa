import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import proxy, { config } from "./proxy";

vi.mock("@/features/catalog/exams", async (original) => {
  const exams = await original<typeof import("@/features/catalog/exams")>();
  return {
    ...exams,
    openExamPath: (id: string) =>
      id === "ftn-p3" ? "/ftn/p3" : exams.openExamPath(id),
  };
});

const rewrite = async (path: string) => {
  const response = await proxy(
    new NextRequest(new URL(path, "https://doindeksa.rs")),
  );
  return response.headers.get("x-middleware-rewrite") ?? "";
};

const missing = (locale: string) => `https://doindeksa.rs/${locale}/404`;

const redirect = async (path: string) => {
  const response = await proxy(
    new NextRequest(new URL(path, "https://doindeksa.rs")),
  );
  return [response.status, response.headers.get("location")];
};

describe("proxy", () => {
  it.each([
    "/ftn/p1/bank/eks-001",
    "/ftn/p1/theory/exponential-equations",
    "/ftn/p1/theory/exponential-equations/methods",
    "/ftn/p1/theory/exponential-equations/methods/substitution",
    "/ftn/p1/variants/ftn-p1-2025",
    "/ftn/p1/variants/set-eks-001.log-001",
    "/ftn/p1/bank/start/logarithms",
    "/ftn/p1/bank",
    "/ftn/p1/bank/topic/logarithms",
    "/ru/ftn/p1/bank/topic/logarithms?level=easy",
    "/ftn/p1/bank/topic/logarithms/2",
    "/ftn/p1/theory",
    "/ftn/p1/variants",
    "/ru/ftn/p1/theory/exponential-equations",
    "/RU/ftn/p1/bank",
    "/En/privacy",
  ])("lets %s through", async (path) => {
    expect(await rewrite(path)).not.toMatch(/\/404$/);
  });

  it.each([
    ["/ftn/p1/bank/nema-zadatka", "sr-Latn"],
    ["/ftn/p1/theory/nema-teme", "sr-Latn"],
    ["/ftn/p1/theory/nema-teme/methods", "sr-Latn"],
    ["/ftn/p1/theory/exponential-equations/methods/nema-metoda", "sr-Latn"],
    ["/ftn/p1/theory/nema-teme/methods/substitution", "sr-Latn"],
    ["/ftn/p1/variants/nema-varijante", "sr-Latn"],
    ["/ftn/p1/variants/set-eks-001.nema-zadatka", "sr-Latn"],
    ["/ru/ftn/p1/theory/nema-teme", "ru"],
    ["/en/ftn/p1/variants/nema-varijante", "en"],
    ["/sr-Latn/ftn/p1/bank/nema-zadatka", "sr-Latn"],
    ["/ftn/p1/bank/topic/nema-teme", "sr-Latn"],
    ["/en/ftn/p1/bank/topic/nema-teme", "en"],
    ["/ftn/p1/bank/topic/nema-teme/2", "sr-Latn"],
    ["/ftn/p1/bank/topic/logarithms/1", "sr-Latn"],
    ["/ftn/p1/bank/topic/logarithms/02", "sr-Latn"],
    ["/ru/ftn/p1/bank/topic/logarithms/strana", "ru"],
  ])("sends %s to the not found page", async (path, locale) => {
    expect(await rewrite(path)).toBe(missing(locale));
  });

  it.each([
    ["/ftn/p1/bank?topic=logarithms", "/ftn/p1/bank/topic/logarithms"],
    [
      "/ftn/p1/bank?q=log&topic=logarithms&level=easy",
      "/ftn/p1/bank/topic/logarithms?q=log&level=easy",
    ],
    [
      "/ru/ftn/p1/bank?topic=logarithms&sort=hard",
      "/ru/ftn/p1/bank/topic/logarithms?sort=hard",
    ],
    [
      "/sr-Latn/ftn/p1/bank?topic=logarithms",
      "/sr-Latn/ftn/p1/bank/topic/logarithms",
    ],
    [
      "/en/ftn/p1/bank?utm_source=ig&topic=logarithms",
      "/en/ftn/p1/bank/topic/logarithms?utm_source=ig",
    ],
    ["/ftn/p1/bank?topic=&level=easy", "/ftn/p1/bank?level=easy"],
  ])("moves %s to %s", async (path, location) => {
    expect(await redirect(path)).toEqual([
      308,
      `https://doindeksa.rs${location}`,
    ]);
  });

  it.each([
    ["/ftn/p3", "sr-Latn"],
    ["/ftn/p9/bank", "sr-Latn"],
    ["/ru/xyz/p1/bank", "ru"],
    ["/bank/eks-001", "sr-Latn"],
  ])(
    "sends %s outside an open exam to the not found page",
    async (path, locale) => {
      expect(await rewrite(path)).toBe(missing(locale));
    },
  );

  it.each([
    ["/", "/ftn/p1"],
    ["/sr-Latn", "/ftn/p1"],
    ["/ru?utm_source=ig", "/ru/ftn/p1?utm_source=ig"],
    ["/RU", "/ru/ftn/p1"],
  ])("sends %s into the first open exam", async (path, location) => {
    const response = await proxy(
      new NextRequest(new URL(path, "https://doindeksa.rs")),
    );
    expect([response.status, response.headers.get("location")]).toEqual([
      307,
      `https://doindeksa.rs${location}`,
    ]);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  const visit = (path: string, headers: Record<string, string> = {}) =>
    proxy(new NextRequest(new URL(path, "https://doindeksa.rs"), { headers }));

  it.each([
    ["__Host-exam=ftn-p1", "/", "/ftn/p1"],
    ["__Host-exam=ftn-p1", "/ru", "/ru/ftn/p1"],
    ["__Host-exam=ftn-p3", "/", "/ftn/p3"],
    ["__Host-exam=ftn-p3", "/ru", "/ru/ftn/p3"],
    ["__Host-exam=ftn-p9", "/", "/ftn/p1"],
    ["__Host-profile=token", "/", "/ftn/p1"],
    ["better-auth.session_token=token", "/en", "/en/ftn/p1"],
  ])(
    "sends a visitor with %s from %s to %s",
    async (cookie, path, location) => {
      const response = await visit(path, { cookie });
      expect([response.status, response.headers.get("location")]).toEqual([
        307,
        `https://doindeksa.rs${location}`,
      ]);
      expect(response.headers.get("cache-control")).toBe("no-store");
    },
  );

  it.each([
    ["/sr-Latn/opengraph-image", false],
    ["/ru/opengraph-image", false],
    ["/ru/bank/opengraph-image", false],
    ["/", true],
    ["/bank/eks-001", true],
  ])("runs on %s: %s", (url, runs) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(runs);
  });
});
