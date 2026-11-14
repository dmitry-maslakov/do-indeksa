import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { generateSitemaps } from "./sitemap";

const personal = ["/review", "/stats", "/v/", "/variants/set-"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...routing.locales.flatMap((locale) =>
          personal.map((href) => getPathname({ href, locale })),
        ),
      ],
    },
    sitemap: (await generateSitemaps()).map(
      ({ id }) => new URL(`/sitemap/${id}.xml`, siteUrl).href,
    ),
  };
}
