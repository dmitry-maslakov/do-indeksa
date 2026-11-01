import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { launchPages } from "@/features/launch/launch";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { env } from "@/server/env";
import { generateSitemaps } from "./sitemap";

const personal = ["/review", "/v/", "/variants/set-"];

const open = {
  allow: "/",
  disallow: [
    "/api/",
    ...routing.locales.flatMap((locale) =>
      personal.map((href) => getPathname({ href, locale })),
    ),
  ],
};

const closed = {
  allow: [
    ...routing.locales.flatMap((locale) =>
      launchPages.map((href) => `${getPathname({ href, locale })}$`),
    ),
    "/_next/static/",
    "/sitemap/",
  ],
  disallow: "/",
};

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  return {
    rules: { userAgent: "*", ...(env.LAUNCH_ACCESS ? closed : open) },
    sitemap: (await generateSitemaps()).map(
      ({ id }) => new URL(`/sitemap/${id}.xml`, siteUrl).href,
    ),
  };
}
