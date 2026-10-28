import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTest } from "@/features/tests/history";
import { outcomesOf } from "@/features/tests/outcomes";
import { ReviewRows } from "@/features/tests/results/review-rows";
import { review } from "@/features/tests/review";
import { variantTitle } from "@/features/variants/variant-title";
import { getVariant, tasksFor } from "@/features/variants/variants";
import { Link } from "@/i18n/navigation";
import { getProfileId } from "@/server/profile";
import { LostPoints } from "./_components/lost-points";
import { ReviewSummary } from "./_components/review-summary";
import { TimeSpent } from "./_components/time-spent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Review");
  return { title: t("title") };
}

interface ReviewProps {
  params: Promise<{ code?: string }>;
  searchParams: PageProps<"/[locale]/review">["searchParams"];
}

export default function ReviewPage({ params, searchParams }: ReviewProps) {
  return (
    <main className="max-w-300 px-4 pb-10 md:px-10 md:pb-14">
      <Suspense fallback={<ReviewGhost />}>
        <ReviewView params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ReviewView({ params, searchParams }: ReviewProps) {
  const t = await getTranslations("Review");
  const [{ code }, { test }] = await Promise.all([params, searchParams]);
  const key = code ?? (typeof test === "string" ? test : undefined);
  const found = await getTest(await getProfileId(), key);

  return (
    <>
      <PageTitle className={found ? "sr-only" : "pt-4 pb-5"}>
        {t("title")}
      </PageTitle>
      {!found ? (
        <Card className="max-w-xl items-start gap-4">
          <p className="text-subtle">{t("empty")}</p>
          <Button render={<Link href="/variants" />} nativeButton={false}>
            {t("toVariants")}
          </Button>
        </Card>
      ) : (
        <TestReview found={found} />
      )}
    </>
  );
}

function ReviewGhost() {
  return (
    <div className="flex flex-col gap-7 pt-2 md:pt-5">
      <Skeleton className="h-3 w-64" />
      <div className="grid gap-5.5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-16 w-48 rounded-xl" />
          <Skeleton className="h-12 w-72 rounded-xl" />
        </div>
        <Skeleton className="h-2.5" />
      </div>
      <div className="grid gap-10 pt-2 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col gap-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-3.5" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-2.5" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>
      </div>
    </div>
  );
}

async function TestReview({
  found,
}: {
  found: NonNullable<Awaited<ReturnType<typeof getTest>>>;
}) {
  const locale = await getLocale();
  const tasks = await tasksFor(found.test.taskIds, locale);
  const result = review(tasks, found.attempts);
  const variant = getVariant(found.test.variantId);

  return (
    <div className="flex flex-col gap-10 pt-2 md:gap-12 md:pt-5">
      <ReviewSummary
        review={result}
        variantId={found.test.variantId}
        title={
          variant ? await variantTitle(variant, locale) : found.test.variantId
        }
        original={variant?.original}
        finishedAt={found.test.finishedAt}
      />
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14">
        <ReviewRows
          review={result}
          outcomes={outcomesOf(found.attempts)}
          testSessionId={found.test.id}
        />
        <div className="flex flex-col gap-10">
          <LostPoints
            review={result}
            names={Object.fromEntries(
              tasks.map((task) => [task.topic, task.topicName]),
            )}
          />
          <TimeSpent review={result} />
        </div>
      </div>
    </div>
  );
}
