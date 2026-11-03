import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const requested = locale ?? (await rootParams.locale());
  const resolved = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale: resolved,
    timeZone: "Europe/Belgrade",
    messages: (await import(`../../messages/${resolved}.json`)).default,
  };
});
