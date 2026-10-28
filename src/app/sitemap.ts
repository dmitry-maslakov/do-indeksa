import { chunk } from "es-toolkit";
import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { tasks } from "@/features/catalog/tasks";
import { contentVariants } from "@/features/exam/variants";
import { launchPages } from "@/features/launch/launch";
import { theories, theoryMethods } from "@/features/theory/theory";
import { languages } from "@/i18n/alternates";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { env } from "@/server/env";

const urlsPerSitemap = 10_000;

const pages = [
  "/",
  "/bank",
  "/variants",
  "/privacy",
  "/terms",
  ...contentVariants.map((v) => `/variants/${v.id}`),
  "/theory",
  ...theories.flatMap((t) => [
    `/theory/${t.topic}`,
    `/theory/${t.topic}/methods`,
  ]),
  ...theoryMethods.map((m) => `/theory/${m.topic}/methods/${m.slug}`),
];

const taskPages = chunk(
  tasks.map((t) => `/bank/${t.id}`),
  Math.floor(urlsPerSitemap / routing.locales.length),
);

const sitemaps = () =>
  env.LAUNCH_ACCESS ? [launchPages] : [pages, ...taskPages];

const url = (path: string) => new URL(path, siteUrl).href;

export async function generateSitemaps() {
  return sitemaps().map((_, id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  await connection();
  return (sitemaps()[Number(await id)] ?? []).flatMap((href) =>
    routing.locales.map((locale) => ({
      url: url(getPathname({ href, locale })),
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languages(href)).map(([l, path]) => [l, url(path)]),
        ),
      },
    })),
  );
}
