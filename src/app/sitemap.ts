import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { tasks } from "@/content/tasks";
import { contentVariants } from "@/content/variants";
import { languages } from "@/i18n/alternates";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { launchPages } from "@/lib/launch";
import { siteUrl } from "@/lib/site";
import { env } from "@/server/env";

const pages = [
  "/",
  "/bank",
  "/variants",
  "/privacy",
  ...tasks.map((t) => `/bank/${t.id}`),
  ...contentVariants.map((v) => `/variants/${v.id}`),
];

const url = (path: string) => new URL(path, siteUrl).href;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  return (env.LAUNCH_ACCESS ? launchPages : pages).flatMap((href) =>
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
