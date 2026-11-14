import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { findTasks } from "@/features/bank/search";
import { examAt, inExam } from "@/features/catalog/exams";
import { alternates } from "@/i18n/alternates";
import { Bank, BankResults } from "./_components/bank-results";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/bank">): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const href = inExam(examAt(await params), "/bank");
  return {
    title: t("bankTitle"),
    description: t("bankDescription"),
    alternates: alternates(href, await getLocale()),
  };
}

export default async function BankPage({
  params,
  searchParams,
}: PageProps<"/[locale]/[faculty]/[exam]/bank">) {
  const t = await getTranslations("Bank");
  const examId = examAt(await params);

  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      <Suspense
        fallback={
          <BankResults
            examId={examId}
            filters={{}}
            tasks={findTasks(examId, {})}
          />
        }
      >
        <Bank examId={examId} topic={null} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
