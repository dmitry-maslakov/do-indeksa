import { escapeRegExp } from "es-toolkit";
import { expect, it } from "vitest";
import robots from "./robots";
import sitemap, { generateSitemaps } from "./sitemap";

const matcher = (rule: string) =>
  new RegExp(`^${rule.split("*").map(escapeRegExp).join(".*")}`);

async function disallowed() {
  const { rules } = await robots();
  return [rules]
    .flat()
    .flatMap((rule) => [rule.disallow ?? []].flat())
    .map(matcher);
}

async function sitemapPaths() {
  const parts = await Promise.all(
    (await generateSitemaps()).map(({ id }) =>
      sitemap({ id: Promise.resolve(String(id)) }),
    ),
  );
  return parts.flat().map((entry) => new URL(entry.url).pathname);
}

it("lists no address that robots.txt disallows", async () => {
  const rules = await disallowed();
  const paths = await sitemapPaths();
  expect(paths.length).toBeGreaterThan(0);
  expect(paths.filter((path) => rules.some((r) => r.test(path)))).toEqual([]);
});

it("lists only addresses inside an exam or outside every exam", async () => {
  expect(
    (await sitemapPaths()).filter(
      (path) =>
        !/^(\/(ru|en))?(\/ftn\/p1(\/|$)|\/privacy$|\/terms$)|^\/ftn$/.test(
          path,
        ),
    ),
  ).toEqual([]);
});

it("disallows personal pages of every exam and locale", async () => {
  const rules = await disallowed();
  for (const path of [
    "/ftn/p1/stats",
    "/ru/ftn/p1/review/abc",
    "/en/ftn/p1/v/ABC",
    "/ftn/p1/variants/set-eks-001",
  ])
    expect(
      rules.some((r) => r.test(path)),
      path,
    ).toBe(true);
  expect(rules.some((r) => r.test("/ftn/p1/variants/ftn-p1-2025"))).toBe(false);
});
