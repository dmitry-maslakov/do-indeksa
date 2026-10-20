import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { BankFilters } from "@/features/bank/bank-filters";
import { BankList } from "@/features/bank/bank-list";
import { BankTabs } from "@/features/bank/bank-tabs";
import { FilterLabel } from "@/features/bank/filter-label";
import { FilterSearch } from "@/features/bank/filter-search";
import { FiltersSheet } from "@/features/bank/filters-sheet";
import { activeFilters, filterLabel } from "@/features/bank/label";
import { loadBankFilters, serializeBankFilters } from "@/features/bank/params";
import { type BankFilters as Filters, findTasks } from "@/features/bank/search";
import { getProgress } from "@/features/progress/progress";
import type { Progress } from "@/features/progress/status";
import type { TaskSummary } from "@/features/tasks/tasks";
import { alternates } from "@/i18n/alternates";
import { getSession } from "@/server/auth";
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
  const tasks = findTasks(filters);
  const session = await getSession();

  return session ? (
    <Suspense
      fallback={<BankResults filters={filters} tasks={tasks} signedIn />}
    >
      <Await promise={getProgress(session.user.id)}>
        {(progress) => (
          <BankResults
            filters={filters}
            tasks={findTasks(filters, progress)}
            signedIn
            progress={progress}
          />
        )}
      </Await>
    </Suspense>
  ) : (
    <BankResults filters={filters} tasks={tasks} signedIn={false} />
  );
}

interface BankResultsProps {
  filters: Filters;
  tasks: TaskSummary[];
  signedIn?: boolean;
  progress?: Progress;
  pending?: boolean;
}

function BankResults({
  filters,
  tasks,
  signedIn = false,
  progress,
  pending = signedIn && !progress && Boolean(filters.status),
}: BankResultsProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();
  const search = serializeBankFilters(filters);

  return (
    <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="sticky top-3 hidden flex-col gap-4 rounded-2xl bg-muted p-4 lg:flex">
        <BankTabs />
        <BankFilters signedIn={signedIn} variant="card">
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
          <BankTabs />
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
              <BankFilters signedIn={signedIn} />
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
          <BankList
            tasks={tasks}
            search={search}
            signedIn={signedIn}
            progress={progress}
          />
        )}
      </section>
    </div>
  );
}
