import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { generateSitemaps } from "./sitemap";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/*/stats", "/*/review", "/*/v/", "/*/variants/set-"],
    },
    sitemap: (await generateSitemaps()).map(
      ({ id }) => new URL(`/sitemap/${id}.xml`, siteUrl).href,
    ),
  };
}
