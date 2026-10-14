import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { BankFilters } from "@/features/bank/bank-filters";
import { FilterSelect } from "@/features/bank/filter-select";
import { MoreTasks } from "@/features/bank/more-tasks";
import { loadBankFilters, serializeBankFilters } from "@/features/bank/params";
import {
  bankPage,
  type BankFilters as Filters,
  filterByStatus,
  searchBank,
} from "@/features/bank/search";
import { taskCards } from "@/features/bank/task-card";
import type { TaskSummary } from "@/features/tasks/tasks";
import { alternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import type { Progress } from "@/lib/progress";
import { getSession } from "@/server/auth";
import { getProgress } from "@/server/progress";

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
    <main className="px-4 pb-9 md:px-9">
      <PageTitle>{t("title")}</PageTitle>
      <NuqsAdapter>
        <Suspense
          fallback={<BankResults filters={{}} tasks={searchBank({})} pending />}
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
  const tasks = searchBank(filters);
  const session = await getSession();

  return session ? (
    <Suspense
      fallback={<BankResults filters={filters} tasks={tasks} signedIn />}
    >
      <Await promise={getProgress(session.user.id)}>
        {(progress) => (
          <BankResults
            filters={filters}
            tasks={filterByStatus(tasks, filters.status, progress)}
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
  signedIn,
  progress,
  pending = signedIn && !progress && Boolean(filters.status),
}: BankResultsProps) {
  const t = useTranslations("Bank");
  const search = serializeBankFilters(filters);

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
      <BankFilters
        signedIn={signedIn}
        solveHref={tasks[0] ? `/bank/${tasks[0].id}` : "/bank"}
      />
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-4 px-1 text-sm">
          {pending ? (
            <Skeleton className="h-3 w-20" />
          ) : (
            <span className="font-semibold">
              {t("count", { count: tasks.length })}
            </span>
          )}
          <FilterSelect name="sort" size="sm" aria-label={t("sort")}>
            <NativeSelectOption value="">{t("sortNumber")}</NativeSelectOption>
            <NativeSelectOption value="easy">
              {t("sortEasy")}
            </NativeSelectOption>
            <NativeSelectOption value="hard">
              {t("sortHard")}
            </NativeSelectOption>
          </FilterSelect>
        </div>
        {pending ? (
          [80, 60, 70].map((width) => (
            <Card key={width} size="sm">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28 rounded-md" />
                <Skeleton className="my-1.5 h-3 w-24" />
              </div>
              <Skeleton className="mt-1 h-3.5" />
              <Skeleton className="h-3.5" style={{ width: `${width}%` }} />
            </Card>
          ))
        ) : tasks.length === 0 ? (
          <Card className="items-center text-center">
            <p className="font-semibold">{t("empty")}</p>
            <p className="text-muted-foreground text-sm">{t("emptyHint")}</p>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/bank" />}
              nativeButton={false}
            >
              {t("showAll")}
            </Button>
          </Card>
        ) : (
          <>
            {taskCards(tasks.slice(0, bankPage), progress)}
            {tasks.length > bankPage && (
              <MoreTasks key={search} search={search} next={bankPage} />
            )}
          </>
        )}
      </section>
    </div>
  );
}
