import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { examAt, inExam } from "@/features/catalog/exams";
import { solutionsMetadata } from "@/features/variants/variant-title";
import { contentVariants } from "@/features/variants/variants";
import { untranslated } from "@/i18n/alternates";
import { SolutionsView } from "./_components/solutions-view";

export function generateStaticParams() {
  return contentVariants.map((v) => ({ id: v.id }));
}

const variantOf = (id: string) => contentVariants.find((v) => v.id === id);

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/variants/[id]/solutions">): Promise<Metadata> {
  const { id, ...exam } = await params;
  const variant = variantOf(id);
  if (!variant) return {};
  const href = inExam(examAt(exam), `/variants/${id}/solutions`);
  return {
    ...(await solutionsMetadata(variant)),
    ...untranslated(href, await getLocale()),
  };
}

export default async function SolutionsPage({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/variants/[id]/solutions">) {
  const { id, ...exam } = await params;
  const variant = variantOf(id);
  if (!variant) notFound();
  return (
    <main className="px-4 pb-12 md:px-10 md:pt-2 md:pb-15">
      <SolutionsView examId={examAt(exam)} variant={variant} />
    </main>
  );
}
