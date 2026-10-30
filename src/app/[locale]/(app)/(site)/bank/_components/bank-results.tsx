import { useLocale, useTranslations } from "next-intl";
import { BankList } from "@/features/bank/bank-list";
import { BankTabs } from "@/features/bank/bank-tabs";
import { activeFilters, filterLabel } from "@/features/bank/filter-summary";
import { BankFilters } from "@/features/bank/filters/bank-filters";
import { FilterLabel } from "@/features/bank/filters/filter-label";
import { FilterSearch } from "@/features/bank/filters/filter-search";
import { FiltersSheet } from "@/features/bank/filters/filters-sheet";
import { loadBankFilters, serializeBankFilters } from "@/features/bank/params";
import { nextTasks, topicStart } from "@/features/bank/queue/queue";
import { type BankQuery, findTasks } from "@/features/bank/search";
import { positions } from "@/features/catalog/exams";
import type { TaskSummary } from "@/features/catalog/tasks";
import { getTaskStatuses } from "@/features/progress/progress";
import type { TaskStatuses } from "@/features/progress/status";
import { getProfileId } from "@/server/profile";
import { EmptyResults } from "./empty-results";
import { ResultsHead } from "./results-head";
import { ResultsSkeleton } from "./results-skeleton";

export async function Bank({
  searchParams,
}: Pick<PageProps<"/[locale]/bank">, "searchParams">) {
  const filters = await loadBankFilters(searchParams);
  const profileId = await getProfileId();
  const [statuses, starts] = await Promise.all([
    getTaskStatuses(profileId),
    nextTasks(profileId),
  ]);
  const topic = filters.topic ?? positions[0]?.topic ?? "";

  return (
    <BankResults
      filters={filters}
      tasks={findTasks(filters, statuses)}
      statuses={statuses}
      recommended={topicStart(starts, topic)}
    />
  );
}

interface BankResultsProps {
  filters: BankQuery;
  tasks: TaskSummary[];
  statuses?: TaskStatuses;
  recommended?: string;
  pending?: boolean;
}

export function BankResults({
  filters,
  tasks,
  statuses,
  recommended,
  pending = false,
}: BankResultsProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();
  const search = serializeBankFilters(filters);

  return (
    <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="sticky top-3 hidden flex-col gap-4 rounded-2xl bg-muted p-4 lg:flex">
        <BankTabs recommended={recommended} />
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
          <BankTabs recommended={recommended} />
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
          <BankList tasks={tasks} search={search} statuses={statuses} />
        )}
      </section>
    </div>
  );
}
