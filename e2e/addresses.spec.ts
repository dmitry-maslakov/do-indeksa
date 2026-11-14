import type { Page } from "@playwright/test";
import { allTasks, allTopics } from "content-collections";
import { legacyPages } from "../src/lib/legacy-addresses";
import { expect, test } from "./fixtures";

const statusOf = (source: string) =>
  legacyPages.find((page) => page.source === source)?.statusCode ?? 301;

const moves: [source: string, from: string, to: string, then?: number][] = [
  [
    "/bank",
    "/bank?topic=logarithms",
    "/ftn/p1/bank/topic/logarithms?topic=logarithms",
  ],
  ["/bank/:path*", "/bank", "/ftn/p1/bank"],
  ["/bank/:path*", "/bank/eks-001", "/ftn/p1/bank/eks-001"],
  ["/bank/:path*", "/bank/topic/logarithms", "/ftn/p1/bank/topic/logarithms"],
  [
    "/bank/:path*",
    "/bank/start/logarithms",
    "/ftn/p1/bank/start/logarithms",
    307,
  ],
  ["/variants/:path*", "/variants", "/ftn/p1/variants"],
  [
    "/variants/:path*",
    "/variants/ftn-p1-2025/solutions",
    "/ftn/p1/variants/ftn-p1-2025/solutions",
  ],
  ["/theory/:path*", "/theory", "/ftn/p1/theory"],
  [
    "/theory/:path*",
    "/theory/exponential-equations/methods",
    "/ftn/p1/theory/exponential-equations/methods",
  ],
  ["/stats", "/stats", "/ftn/p1/stats"],
  ["/review/:path*", "/review", "/ftn/p1/review"],
  ["/v/:code", "/v/NEMA?utm_source=x", "/ftn/p1/v/NEMA?utm_source=x"],
  ["/tasks/:topic/:id", "/tasks/x/log-002", "/ftn/p1/bank/log-002"],
  [
    "/tasks",
    "/tasks?topic=stereometrija",
    "/ftn/p1/bank/topic/solid-geometry?topic=stereometrija",
  ],
  ["/(tasks|training)/:path*", "/tasks", "/ftn/p1/bank"],
  ["/(tasks|training)/:path*", "/training/new", "/ftn/p1/bank"],
  ["/exams/:exam(ftn-p1)", "/exams/ftn-p1", "/ftn/p1/variants"],
  ["/(diagnostic|simulation)/:path*", "/simulation/new", "/ftn/p1/variants"],
  ["/history/:path*", "/history", "/ftn/p1/variants?tab=history"],
  ["/cabinet", "/cabinet", "/ftn/p1/stats"],
  ["/prep", "/prep", "/ftn/p1"],
];

for (const [source, from, to, then = 200] of moves) {
  for (const [prefix, target] of [
    ["", ""],
    ["/sr-Latn", ""],
    ["/ru", "/ru"],
  ]) {
    test(`moves ${prefix}${from} in one hop`, async ({ request }) => {
      const res = await request.get(`${prefix}${from}`, { maxRedirects: 0 });
      expect(res.status()).toBe(statusOf(source));
      expect(res.headers().location).toBe(`${target}${to}`);
      const next = await request.get(`${target}${to}`, { maxRedirects: 0 });
      expect(next.status()).toBe(then);
    });
  }
}

for (const [from, to] of [
  ["/launch", "/"],
  ["/sr-Latn/launch", "/"],
  ["/ru/launch", "/ru"],
] as const) {
  test(`moves ${from} to the start for now`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(statusOf("/launch"));
    expect(res.headers().location).toBe(to);
  });
}

test("answers from the route handlers inside an exam", async ({ request }) => {
  for (const path of [
    `/ftn/p1/bank/start/${allTopics[0]?.id}`,
    `/ftn/p1/bank/similar/${allTasks[0]?.id}`,
  ]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(307);
    expect(res.headers().location, path).toMatch(/^\/ftn\/p1\//);
  }
});

for (const path of [
  "/ftn/p3",
  "/ftn/p9/bank",
  "/xyz/p1/bank",
  "/ftn/p1/nope",
  "/ftn/p1/bank/nope-999",
  "/ftn/p1/bank/topic/nope",
  "/ftn/p1/variants/nope",
  "/ftn/p1/theory/nope",
  "/exams/ftn-p7",
  "/exams/ftn-p8",
]) {
  test(`answers 404 at ${path}`, async ({ request }) => {
    expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(404);
  });
}

for (const [cookie, from, to] of [
  ["", "/", "/ftn/p1"],
  ["__Host-exam=ftn-p1", "/", "/ftn/p1"],
  ["__Host-exam=ftn-p1", "/sr-Latn", "/ftn/p1"],
  ["__Host-exam=ftn-p1", "/ru", "/ru/ftn/p1"],
  ["__Host-profile=x", "/", "/ftn/p1"],
] as const) {
  test(`sends ${from} with "${cookie}" to ${to}`, async ({ request }) => {
    const res = await request.get(from, {
      maxRedirects: 0,
      headers: cookie ? { cookie } : {},
    });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toBe(to);
    expect(res.headers()["cache-control"]).toContain("no-store");
  });
}

const examCookie = async (page: Page) =>
  (await page.context().cookies()).find(({ name }) => name === "__Host-exam")
    ?.value;

test("remembers the exam of a shown page", async ({ page }) => {
  await page.goto("/privacy");
  expect(await examCookie(page)).toBeUndefined();
  await page.goto("/ru/ftn/p1/bank");
  await expect.poll(() => examCookie(page)).toBe("ftn-p1");
});

test("points search engines at the exam address", async ({ page }) => {
  await page.goto("/ftn/p1/bank/eks-001");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://doindeksa.rs/ftn/p1/bank/eks-001",
  );
  await page.goto("/ru/ftn/p1/bank");
  for (const [lang, href] of [
    ["sr-Latn", "/ftn/p1/bank"],
    ["ru", "/ru/ftn/p1/bank"],
    ["en", "/en/ftn/p1/bank"],
  ])
    await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveAttribute(
      "href",
      `https://doindeksa.rs${href}`,
    );
});
