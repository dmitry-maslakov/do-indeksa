import { getLocale, getTranslations } from "next-intl/server";
import { SignInCard } from "@/components/sign-in-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { variantTitle } from "@/components/variant-title";
import { getVariant, tasksFor } from "@/content/variants";
import { Link } from "@/i18n/navigation";
import { review } from "@/lib/review";
import { getSession } from "@/server/auth";
import { getRun } from "@/server/history";
import { LostPoints } from "./_components/lost-points";
import { ReviewRows } from "./_components/review-rows";
import { ReviewSummary } from "./_components/review-summary";
import { TimeSpent } from "./_components/time-spent";

export default async function ReviewPage({
  searchParams,
}: PageProps<"/[locale]/review">) {
  const t = await getTranslations("Review");
  const session = await getSession();
  const { run: runId } = await searchParams;
  const found =
    session &&
    (await getRun(
      session.user.id,
      typeof runId === "string" ? runId : undefined,
    ));

  return (
    <main className="px-4 pb-9 md:px-9">
      <h1 className="py-6 font-bold text-3xl">{t("title")}</h1>
      {!session ? (
        <SignInCard text={t("guest")} />
      ) : !found ? (
        <Card className="max-w-xl items-start gap-4">
          <p className="text-subtle">{t("empty")}</p>
          <Button render={<Link href="/variants" />} nativeButton={false}>
            {t("toVariants")}
          </Button>
        </Card>
      ) : (
        <RunReview found={found} />
      )}
    </main>
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
    <div className="flex flex-col gap-6">
      <ReviewSummary
        review={result}
        variantId={found.run.variantId}
        title={variant ? await variantTitle(variant) : found.run.variantId}
        finishedAt={found.run.finishedAt}
        weakest={tasks.find(
          (task) => task.topic === result.lost.find((l) => l.topic)?.topic,
        )}
      />
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ReviewRows review={result} tasks={tasks} />
        <div className="flex flex-col gap-5">
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
