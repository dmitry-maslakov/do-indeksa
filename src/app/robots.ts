import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

const personal = [
  "/review",
  "/stats",
  "/v/",
  "/daily",
  "/variants/compose",
  "/variants/daily-",
  "/variants/set-",
];

export default function robots(): MetadataRoute.Robots {
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
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}
