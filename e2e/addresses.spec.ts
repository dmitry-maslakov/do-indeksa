import type { Page } from "@playwright/test";
import { allTasks, allTopics } from "content-collections";
import { expect, test } from "./fixtures";

const moves: [from: string, to: string, then?: number][] = [
  ["/bank?topic=logarithms", "/ftn/p1/bank/topic/logarithms?topic=logarithms"],
  ["/bank", "/ftn/p1/bank"],
  ["/bank/eks-001", "/ftn/p1/bank/eks-001"],
  ["/bank/topic/logarithms", "/ftn/p1/bank/topic/logarithms"],
  ["/bank/start/logarithms", "/ftn/p1/bank/start/logarithms", 307],
  ["/variants", "/ftn/p1/variants"],
  ["/variants/ftn-p1-2025/solutions", "/ftn/p1/variants/ftn-p1-2025/solutions"],
  ["/theory", "/ftn/p1/theory"],
  [
    "/theory/exponential-equations/methods",
    "/ftn/p1/theory/exponential-equations/methods",
  ],
  ["/stats", "/ftn/p1/stats"],
  ["/review", "/ftn/p1/review"],
  ["/v/NEMA?utm_source=x", "/ftn/p1/v/NEMA?utm_source=x"],
  ["/tasks/x/log-002", "/ftn/p1/bank/log-002"],
  [
    "/tasks?topic=stereometrija",
    "/ftn/p1/bank/topic/solid-geometry?topic=stereometrija",
  ],
  ["/tasks", "/ftn/p1/bank"],
  ["/training/new", "/ftn/p1/bank"],
  ["/exams/ftn-p1", "/ftn/p1/about"],
  ["/simulation/new", "/ftn/p1/variants"],
  ["/history", "/ftn/p1/variants?tab=history"],
  ["/cabinet", "/ftn/p1/stats"],
  ["/prep", "/ftn/p1"],
];

for (const [from, to, then = 200] of moves) {
  for (const [prefix, target] of [
    ["", ""],
    ["/sr-Latn", ""],
    ["/ru", "/ru"],
  ]) {
    test(`moves ${prefix}${from} in one hop`, async ({ request }) => {
      const res = await request.get(`${prefix}${from}`, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
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
  test(`moves ${from} to the landing in one hop`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers().location).toBe(to);
    const next = await request.get(to, { maxRedirects: 0 });
    expect(next.status()).toBe(200);
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
  "/a/b/c.php",
  "/ftn/p1/x.php",
  "/ftn/p1/.env",
  "/ru/a/b.php",
  "/a/b/c/bank/x.php",
]) {
  test(`answers 404 at ${path}`, async ({ request }) => {
    expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(404);
  });
}

for (const [cookie, from, to] of [
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

for (const [cookie, path] of [
  ["", "/"],
  ["", "/ru"],
  ["__Host-exam=nope", "/"],
  ["__Host-exam=ftn-p1", "/?pick=1"],
  ["__Host-profile=x", "/en?pick=1"],
] as const) {
  test(`shows the landing at ${path} with "${cookie}"`, async ({ request }) => {
    const res = await request.get(path, {
      maxRedirects: 0,
      headers: cookie ? { cookie } : {},
    });
    expect(res.status()).toBe(200);
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
