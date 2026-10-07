import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sr-Latn", "ru", "en"],
  defaultLocale: "sr-Latn",
  localePrefix: "as-needed",
  localeDetection: false,
});
