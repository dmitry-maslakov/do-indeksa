import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { BANK_FORM, BankFilters } from "@/components/bank-filters";
import { FilterSelect } from "@/components/filter-select";
import { PageTitle } from "@/components/page-title";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  bankFiltersSchema,
  type BankFilters as Filters,
  searchBank,
} from "@/content/bank";
import { Link } from "@/i18n/navigation";
import type { Progress } from "@/lib/progress";
import { getSession } from "@/server/auth";
import { getProgress } from "@/server/progress";

export default async function BankPage({
  searchParams,
}: PageProps<"/[locale]/bank">) {
  const filters = bankFiltersSchema.parse(await searchParams);
  const session = await getSession();
  const t = await getTranslations("Bank");

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle>{t("title")}</PageTitle>
      {session ? (
        <Suspense fallback={<BankResults filters={filters} signedIn />}>
          <Await promise={getProgress(session.user.id)}>
            {(progress) => (
              <BankResults filters={filters} signedIn progress={progress} />
            )}
          </Await>
        </Suspense>
      ) : (
        <BankResults filters={filters} signedIn={false} />
      )}
    </main>
  );
}

interface BankResultsProps {
  filters: Filters;
  signedIn: boolean;
  progress?: Progress;
}

function BankResults({ filters, signedIn, progress }: BankResultsProps) {
  const t = useTranslations("Bank");
  const pending = signedIn && !progress && Boolean(filters.status);
  const tasks = searchBank(filters, progress);

  return (
    <div className="grid items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
      <BankFilters
        filters={filters}
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
          <FilterSelect
            form={BANK_FORM}
            name="sort"
            defaultValue={filters.sort ?? ""}
            size="sm"
            aria-label={t("sort")}
          >
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
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={progress?.statuses.get(task.id)}
              favorite={progress?.favorites.has(task.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}
