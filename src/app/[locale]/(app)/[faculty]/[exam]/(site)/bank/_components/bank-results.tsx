import { useLocale, useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { resultsShown } from "@/features/bank/bank-events";
import { BankList } from "@/features/bank/bank-list";
import { BankTabs } from "@/features/bank/bank-tabs";
import { activeFilters, filterLabel } from "@/features/bank/filter-summary";
import { BankFilters } from "@/features/bank/filters/bank-filters";
import { FilterLabel } from "@/features/bank/filters/filter-label";
import { FilterSearch } from "@/features/bank/filters/filter-search";
import { FiltersSheet } from "@/features/bank/filters/filters-sheet";
import {
  bankHref,
  loadBankFilters,
  pagedTopic,
  serializeBankFilters,
} from "@/features/bank/params";
import { type BankQuery, findTasks } from "@/features/bank/search";
import { examOf } from "@/features/catalog/exams";
import type { TaskSummary } from "@/features/catalog/tasks";
import { redirect } from "@/i18n/navigation";
import { EmptyResults } from "./empty-results";
import { loadPersonal } from "./personal";
import { ResultsHead } from "./results-head";

interface BankProps extends Pick<PageProps<"/[locale]/bank">, "searchParams"> {
  examId: string;
  topic: string | null;
  offset?: number;
}

export async function Bank({
  examId,
  topic,
  offset = 0,
  searchParams,
}: BankProps) {
  const filters = { ...(await loadBankFilters(searchParams)), topic };
  if (offset > 0 && !pagedTopic(filters)) {
    redirect({ href: bankHref(filters), locale: await getLocale() });
  }
  const personal = loadPersonal(
    examId,
    topic ?? examOf(examId).positions[0]?.topic ?? "",
  );
  const statuses = filters.status ? (await personal).statuses : undefined;

  return (
    <BankResults
      examId={examId}
      filters={filters}
      tasks={findTasks(examId, filters, statuses)}
      offset={offset}
      personal={personal}
    />
  );
}

interface BankResultsProps {
  examId: string;
  filters: BankQuery;
  tasks: TaskSummary[];
  offset?: number;
  personal?: ReturnType<typeof loadPersonal>;
}

export function BankResults({
  examId,
  filters,
  tasks,
  offset = 0,
  personal,
}: BankResultsProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();
  const search = serializeBankFilters(filters);
  const pending = !personal;
  const start = `/bank/start/${filters.topic ?? examOf(examId).positions[0]?.topic}`;
  const list = bankHref(filters);
  const tabs = (
    <Suspense
      fallback={<BankTabs start={start} list={list} pending={pending} />}
    >
      <BankTabs
        start={start}
        list={list}
        pending={pending}
        pick={personal?.then((p) => p.pick)}
      />
    </Suspense>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="sticky top-3 hidden flex-col gap-4 rounded-2xl bg-muted p-4 lg:flex">
        {tabs}
        <BankFilters examId={examId} variant="card">
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
              <BankFilters examId={examId} />
            </FiltersSheet>
          </div>
        </div>
        <ResultsHead
          key={search}
          count={tasks.length}
          label={filterLabel(filters, t, locale)}
          shown={pending ? undefined : resultsShown(filters, tasks.length)}
        />
        {tasks.length === 0 ? (
          <EmptyResults />
        ) : (
          <BankList
            tasks={tasks}
            search={search}
            offset={offset}
            paged={pagedTopic(filters)}
            statuses={personal?.then((p) => p.statuses)}
          />
        )}
      </section>
    </div>
  );
}
