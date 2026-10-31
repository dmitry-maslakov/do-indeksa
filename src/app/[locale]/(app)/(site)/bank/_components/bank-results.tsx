import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { resultsShown } from "@/features/bank/bank-events";
import { BankList } from "@/features/bank/bank-list";
import { BankTabs } from "@/features/bank/bank-tabs";
import { activeFilters, filterLabel } from "@/features/bank/filter-summary";
import { BankFilters } from "@/features/bank/filters/bank-filters";
import { FilterLabel } from "@/features/bank/filters/filter-label";
import { FilterSearch } from "@/features/bank/filters/filter-search";
import { FiltersSheet } from "@/features/bank/filters/filters-sheet";
import { loadBankFilters, serializeBankFilters } from "@/features/bank/params";
import { type BankQuery, findTasks } from "@/features/bank/search";
import { positions } from "@/features/catalog/exams";
import type { TaskSummary } from "@/features/catalog/tasks";
import { EmptyResults } from "./empty-results";
import { loadPersonal } from "./personal";
import { ResultsHead } from "./results-head";
import { ResultsSkeleton } from "./results-skeleton";

export async function Bank({
  searchParams,
}: Pick<PageProps<"/[locale]/bank">, "searchParams">) {
  const filters = await loadBankFilters(searchParams);
  const personal = loadPersonal(filters.topic ?? positions[0]?.topic ?? "");
  const statuses = filters.status ? (await personal).statuses : undefined;

  return (
    <BankResults
      filters={filters}
      tasks={findTasks(filters, statuses)}
      personal={personal}
    />
  );
}

interface BankResultsProps {
  filters: BankQuery;
  tasks: TaskSummary[];
  personal?: ReturnType<typeof loadPersonal>;
}

export function BankResults({ filters, tasks, personal }: BankResultsProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();
  const search = serializeBankFilters(filters);
  const pending = !personal;
  const tabs = (
    <Suspense fallback={<BankTabs />}>
      <BankTabs pick={personal?.then((p) => p.pick)} />
    </Suspense>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="sticky top-3 hidden flex-col gap-4 rounded-2xl bg-muted p-4 lg:flex">
        {tabs}
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
          {tabs}
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
          key={search}
          count={tasks.length}
          label={filterLabel(filters, t, locale)}
          shown={pending ? undefined : resultsShown(filters, tasks.length)}
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
            statuses={personal.then((p) => p.statuses)}
          />
        )}
      </section>
    </div>
  );
}
