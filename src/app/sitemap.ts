import { chunk } from "es-toolkit";
import type { MetadataRoute } from "next";
import { bankHref } from "@/features/bank/params";
import {
  canonicalHref,
  firstOpenExam,
  inExam,
  openExamIds,
} from "@/features/catalog/exams";
import { faculties } from "@/features/catalog/faculties";
import { tasks } from "@/features/catalog/tasks";
import { topics } from "@/features/catalog/topics";
import { theoriesOf, theoryMethods } from "@/features/theory/theory";
import { contentVariants } from "@/features/variants/variants";
import { languages } from "@/i18n/alternates";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

const urlsPerSitemap = 10_000;

const examPages = [
  "/",
  "/bank",
  ...topics.map((t) => bankHref({ topic: t.id })),
  "/variants",
  ...contentVariants.map((v) => `/variants/${v.id}`),
  "/theory",
];

const translatedPages = [
  "/privacy",
  "/terms",
  ...openExamIds.flatMap((id) => examPages.map((href) => inExam(id, href))),
];

const untranslatedPages = [
  ...faculties.map((f) => `/${f.id}`),
  ...theoriesOf(firstOpenExam()).flatMap(({ topic }) =>
    [`/theory/${topic}`, `/theory/${topic}/methods`].map((href) =>
      canonicalHref(topic, href),
    ),
  ),
  ...theoryMethods.map((m) =>
    canonicalHref(m.topic, `/theory/${m.topic}/methods/${m.slug}`),
  ),
  ...openExamIds.flatMap((id) =>
    contentVariants.map((v) => inExam(id, `/variants/${v.id}/solutions`)),
  ),
];

const url = (path: string) => new URL(path, siteUrl).href;

const withLanguages = (href: string) =>
  routing.locales.map((locale) => ({
    url: url(getPathname({ href, locale })),
    alternates: {
      languages: Object.fromEntries(
        Object.entries(languages(href)).map(([l, path]) => [l, url(path)]),
      ),
    },
  }));

const inDefaultLocale = (href: string) => ({
  url: url(getPathname({ href, locale: routing.defaultLocale })),
});

const sitemaps = (): MetadataRoute.Sitemap[] => [
  [
    ...translatedPages.flatMap(withLanguages),
    ...untranslatedPages.map(inDefaultLocale),
  ],
  ...chunk(
    tasks.map((t) => inDefaultLocale(canonicalHref(t.topic, `/bank/${t.id}`))),
    urlsPerSitemap,
  ),
];

export async function generateSitemaps() {
  return sitemaps().map((_, id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  return sitemaps()[Number(await id)] ?? [];
}
