import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getPathname } from "./navigation";
import { routing } from "./routing";

export const alternates = (
  href: string,
  locale: Locale,
): Metadata["alternates"] => ({
  canonical: getPathname({ href, locale }),
  languages: {
    ...Object.fromEntries(
      routing.locales.map((l) => [l, getPathname({ href, locale: l })]),
    ),
    "x-default": getPathname({ href, locale: routing.defaultLocale }),
  },
});
