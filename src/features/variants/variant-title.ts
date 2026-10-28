import "server-only";
import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { type ExamVariant, minutesOf } from "./variants";

export async function variantTitle(variant: ExamVariant, locale: Locale) {
  const t = await getTranslations({ locale, namespace: "Variants" });
  if (variant.kind === "custom") return t("custom");
  if (variant.kind === "official" && variant.year) {
    const solve = await getTranslations({ locale, namespace: "Solve" });
    return solve("exam", { year: String(variant.year) });
  }
  return variant.title ?? variant.id;
}

export async function variantMetadata(variant: ExamVariant): Promise<Metadata> {
  const t = await getTranslations("Variants");
  return {
    title: await variantTitle(variant, await getLocale()),
    description: t("format", {
      tasks: variant.taskIds.length,
      minutes: minutesOf(variant),
    }),
  };
}
