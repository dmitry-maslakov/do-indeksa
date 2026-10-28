import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import { BankList } from "@/features/bank/bank-list";
import { BankTabs } from "@/features/bank/bank-tabs";
import { activeFilters, filterLabel } from "@/features/bank/filter-summary";
import { BankFilters } from "@/features/bank/filters/bank-filters";
import { FilterLabel } from "@/features/bank/filters/filter-label";
import { FilterSearch } from "@/features/bank/filters/filter-search";
import { FiltersSheet } from "@/features/bank/filters/filters-sheet";
import { loadBankFilters, serializeBankFilters } from "@/features/bank/params";
import { type BankQuery, findTasks } from "@/features/bank/search";
import type { TaskSummary } from "@/features/catalog/tasks";
import { getProgress } from "@/features/progress/progress";
import type { Progress } from "@/features/progress/status";
import { alternates } from "@/i18n/alternates";
import { getProfileId } from "@/server/profile";
import { EmptyResults } from "./_components/empty-results";
import { ResultsHead } from "./_components/results-head";
import { ResultsSkeleton } from "./_components/results-skeleton";

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

async function Bank({
  searchParams,
}: Pick<PageProps<"/[locale]/bank">, "searchParams">) {
  const filters = await loadBankFilters(searchParams);
  const progress = await getProgress(await getProfileId());

  return (
    <BankResults
      filters={filters}
      tasks={findTasks(filters, progress)}
      progress={progress}
    />
  );
}

interface BankResultsProps {
  filters: BankQuery;
  tasks: TaskSummary[];
  progress?: Progress;
  pending?: boolean;
}

function BankResults({
  filters,
  tasks,
  progress,
  pending = false,
}: BankResultsProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();
  const search = serializeBankFilters(filters);

  return (
    <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="sticky top-3 hidden flex-col gap-4 rounded-2xl bg-muted p-4 lg:flex">
        <BankTabs topic={filters.topic} pending={pending} />
        <BankFilters variant="card">
          <FilterLabel text={t("search")}>
            <FilterSearch
              variant="card"
              aria-label={t("search")}
              placeholder={t("searchPlaceholder")}
            />
          </FilterLabel>
        </BankFilters>
      </aside>
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 px-1 lg:hidden">
          <BankTabs topic={filters.topic} pending={pending} />
          <div className="flex gap-2">
            <FilterSearch
              variant="card"
              aria-label={t("search")}
              placeholder={t("searchPlaceholder")}
              className="flex-1"
            />
            <FiltersSheet
              active={activeFilters(filters, t, locale).length}
              count={tasks.length}
            >
              <BankFilters />
            </FiltersSheet>
          </div>
        </div>
        <ResultsHead
          count={tasks.length}
          label={filterLabel(filters, t, locale)}
          pending={pending}
        />
        {pending ? (
          <ResultsSkeleton />
        ) : tasks.length === 0 ? (
          <EmptyResults />
        ) : (
          <BankList tasks={tasks} search={search} progress={progress} />
        )}
      </section>
    </div>
  );
}
