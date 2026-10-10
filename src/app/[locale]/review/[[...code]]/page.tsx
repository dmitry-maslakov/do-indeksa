import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { PageTitle } from "@/components/page-title";
import { PracticeLinks } from "@/components/practice-links";
import { ReviewRows } from "@/components/review-rows";
import { SignInCard } from "@/components/sign-in-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { outcomesOf } from "@/content/outcomes";
import { variantTitle } from "@/content/variant-title";
import { getVariant, tasksFor } from "@/content/variants";
import { Link } from "@/i18n/navigation";
import { review } from "@/lib/review";
import { getSession } from "@/server/auth";
import { getRun } from "@/server/history";
import { LostPoints } from "../_components/lost-points";
import { ReviewSummary } from "../_components/review-summary";
import { TimeSpent } from "../_components/time-spent";

async function loadRun(key?: string) {
  const session = await getSession();
  return {
    signedIn: Boolean(session),
    found: session && (await getRun(session.user.id, key)),
  };
}

export default async function ReviewPage({
  params,
  searchParams,
}: PageProps<"/[locale]/review/[[...code]]">) {
  const t = await getTranslations("Review");
  const [{ code }, { run }] = await Promise.all([params, searchParams]);
  if (code && code.length > 1) notFound();
  const key = code?.[0] ?? (typeof run === "string" ? run : undefined);

  return (
    <main className="px-4 pb-9 md:px-9">
      <Suspense fallback={<ReviewGhost />}>
        <Await promise={loadRun(key)}>
          {({ signedIn, found }) => (
            <>
              <PageTitle className={found ? "sr-only" : undefined}>
                {t("title")}
              </PageTitle>
              {!signedIn ? (
                <SignInCard text={t("guest")} />
              ) : !found ? (
                <Card className="max-w-xl items-start gap-4">
                  <p className="text-subtle">{t("empty")}</p>
                  <Button
                    render={<Link href="/variants" />}
                    nativeButton={false}
                  >
                    {t("toVariants")}
                  </Button>
                </Card>
              ) : (
                <RunReview found={found} />
              )}
            </>
          )}
        </Await>
      </Suspense>
    </main>
  );
}

function ReviewGhost() {
  return (
    <div className="flex flex-col gap-6 pt-2.5">
      <Card size="lg" className="gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-36 rounded-lg" />
        </div>
        <Skeleton className="mb-5 h-3.5" />
      </Card>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="gap-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-3.5" />
          ))}
        </Card>
        <Card className="gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-2.5" />
          <Skeleton className="h-2.5 w-2/3" />
        </Card>
      </div>
    </div>
  );
}

async function RunReview({
  found,
}: {
  found: NonNullable<Awaited<ReturnType<typeof getRun>>>;
}) {
  const tasks = tasksFor(found.run.taskIds, await getLocale());
  const result = review(
    tasks.map((task) => ({ ...task, taskId: task.id })),
    found.attempts,
  );
  const variant = getVariant(found.run.variantId);

  return (
    <div className="flex flex-col gap-6 pt-2.5">
      <ReviewSummary
        review={result}
        variantId={found.run.variantId}
        title={variant ? await variantTitle(variant) : found.run.variantId}
        finishedAt={found.run.finishedAt}
      />
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ReviewRows
          review={result}
          tasks={tasks}
          outcomes={outcomesOf(found.attempts)}
        />
        <div className="flex flex-col gap-5">
          <LostPoints
            review={result}
            names={Object.fromEntries(
              tasks.map((task) => [task.topic, task.topicName]),
            )}
          />
          <TimeSpent review={result} />
          <PracticeLinks
            topics={result.lost.flatMap((l) => {
              const task = tasks.find((x) => x.topic === l.topic);
              return task ? { id: task.topic, name: task.topicName } : [];
            })}
          />
        </div>
      </div>
    </div>
  );
}
