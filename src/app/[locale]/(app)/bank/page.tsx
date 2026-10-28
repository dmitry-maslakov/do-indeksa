import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
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

export default async function BankPage({
  searchParams,
}: PageProps<"/[locale]/bank">) {
  const t = await getTranslations("Bank");

  return (
    <main className="px-3 pt-4 pb-9 max-lg:min-h-dvh max-lg:bg-muted lg:px-10 lg:pt-2 lg:pb-15">
      <h1 className="sr-only">{t("title")}</h1>
      <NuqsAdapter>
        <Suspense
          fallback={<BankResults filters={{}} tasks={findTasks({})} pending />}
        >
          <Bank searchParams={searchParams} />
        </Suspense>
      </NuqsAdapter>
    </main>
  );
}
