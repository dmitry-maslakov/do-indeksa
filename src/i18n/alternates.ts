import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getPathname } from "./navigation";
import { routing } from "./routing";

export const languages = (href: string) => ({
  ...Object.fromEntries(
    routing.locales.map((locale) => [locale, getPathname({ href, locale })]),
  ),
  "x-default": getPathname({ href, locale: routing.defaultLocale }),
});

export const alternates = (
  href: string,
  locale: Locale,
): Metadata["alternates"] => ({
  canonical: getPathname({ href, locale }),
  languages: languages(href),
});
