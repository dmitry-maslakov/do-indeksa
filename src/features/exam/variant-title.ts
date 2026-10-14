import "server-only";
import type { Locale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ExamVariant } from "./variants";

export async function variantTitle(variant: ExamVariant, locale: Locale) {
  const t = await getTranslations({ locale, namespace: "Variants" });
  if (variant.kind === "daily") {
    const format = await getFormatter({ locale });
    const date = new Date(`${variant.id.slice(6)}T12:00:00Z`);
    return t("dailyOn", {
      date: format.dateTime(date, { day: "numeric", month: "long" }),
    });
  }
  if (variant.kind === "custom") return t("custom");
  return variant.title ?? variant.id;
}
