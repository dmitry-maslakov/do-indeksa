import "server-only";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ExamVariant } from "@/content/variants";

export async function variantTitle(variant: ExamVariant) {
  const t = await getTranslations("Variants");
  if (variant.kind === "daily") {
    const format = await getFormatter();
    const date = new Date(`${variant.id.slice(6)}T12:00:00Z`);
    return t("dailyOn", {
      date: format.dateTime(date, { day: "numeric", month: "long" }),
    });
  }
  if (variant.kind === "random") return t("random");
  if (variant.kind === "custom") return t("custom");
  return variant.title ?? String(variant.year);
}
