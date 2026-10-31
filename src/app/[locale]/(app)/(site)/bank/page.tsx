import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { findTasks } from "@/features/bank/search";
import { alternates } from "@/i18n/alternates";
import { Bank, BankResults } from "./_components/bank-results";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("bankTitle"),
    description: t("bankDescription"),
    alternates: alternates("/bank", await getLocale()),
  };
}

export default function BankPage({
  searchParams,
}: PageProps<"/[locale]/bank">) {
  return (
    <Suspense fallback={<BankResults filters={{}} tasks={findTasks({})} />}>
      <Bank topic={null} searchParams={searchParams} />
    </Suspense>
  );
}
