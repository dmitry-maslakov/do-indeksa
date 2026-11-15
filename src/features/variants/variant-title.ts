import "server-only";
import type { Variant } from "content-collections";
import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { testFaculty } from "@/features/catalog/exams";
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

export async function variantMetadata(
  examId: string,
  variant: ExamVariant,
): Promise<Metadata> {
  const format = {
    tasks: variant.taskIds.length,
    minutes: minutesOf(examId, variant),
  };
  if (variant.kind === "official" && variant.year && variant.test) {
    const t = await getTranslations("Metadata");
    const facts = {
      ...format,
      faculty: testFaculty(variant.test),
      year: String(variant.year),
    };
    return {
      title: t("examTestTitle", facts),
      description: t("examTestDescription", facts),
    };
  }
  const t = await getTranslations("Variants");
  return {
    title: await variantTitle(variant, await getLocale()),
    description: t("format", format),
  };
}

const solutionsFacts = (variant: Variant) => ({
  kind: variant.kind,
  faculty: testFaculty(variant.test),
  year: String(variant.year ?? ""),
  title: variant.title,
  tasks: variant.taskIds.length,
});

export async function solutionsTitle(variant: Variant, locale: Locale) {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return t("solutionsTitle", solutionsFacts(variant));
}

export async function solutionsMetadata(variant: Variant): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: await solutionsTitle(variant, locale),
    description: t("solutionsDescription", solutionsFacts(variant)),
  };
}
