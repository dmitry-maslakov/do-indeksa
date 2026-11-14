import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { examAt, inExam } from "@/features/catalog/exams";
import { TestScreen } from "@/features/tests/runner/test-screen";
import { findSetCode, saveSet } from "@/features/variants/custom/sets";
import { variantMetadata } from "@/features/variants/variant-title";
import { contentVariants, getVariant } from "@/features/variants/variants";
import { alternates } from "@/i18n/alternates";
import { redirect } from "@/i18n/navigation";

export const instant = false;

export function generateStaticParams() {
  return contentVariants.map((v) => ({ id: v.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/variants/[id]">) {
  const { id, ...exam } = await params;
  const examId = examAt(exam);
  const variant = getVariant(examId, id);
  if (!variant) return {};
  const metadata = await variantMetadata(examId, variant);
  return contentVariants.some((v) => v.id === id)
    ? {
        ...metadata,
        alternates: alternates(
          inExam(examId, `/variants/${id}`),
          await getLocale(),
        ),
      }
    : metadata;
}

export default async function VariantPage({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/variants/[id]">) {
  const { id, ...exam } = await params;
  const examId = examAt(exam);
  const variant = getVariant(examId, id);
  if (!variant) notFound();
  if (variant.kind === "custom") {
    const code =
      (await findSetCode(variant.taskIds)) ?? (await saveSet(variant.taskIds));
    redirect({ href: inExam(examId, `/v/${code}`), locale: await getLocale() });
  }
  return <TestScreen examId={examId} variant={variant} />;
}
