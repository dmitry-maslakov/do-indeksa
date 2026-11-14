import { getLocale, getTranslations } from "next-intl/server";
import { SignInStrip } from "@/features/account/sign-in-strip";
import { answersOf } from "@/features/tests/comparisons";
import type { getTest } from "@/features/tests/finished-tests";
import { review } from "@/features/tests/review";
import { findSetCode } from "@/features/variants/custom/sets";
import { variantTitle } from "@/features/variants/variant-title";
import { getVariant, tasksFor } from "@/features/variants/variants";
import { toMinutes } from "@/lib/dates";
import type { ReviewEntry } from "./review-entry";
import { ReviewSummary } from "./review-summary";
import { ReviewTasks } from "./review-tasks";

export async function TestReview({
  examId,
  found,
  guest,
}: {
  examId: string;
  found: NonNullable<Awaited<ReturnType<typeof getTest>>>;
  guest: boolean;
}) {
  const locale = await getLocale();
  const strip = await getTranslations("SignInStrip");
  const variant = getVariant(examId, found.test.variantId);
  const [tasks, code] = await Promise.all([
    tasksFor(examId, found.test.taskIds, locale),
    variant?.kind === "custom" && findSetCode(variant.taskIds),
  ]);
  const result = review(tasks, found.attempts);
  const answers = answersOf(found.test.taskIds, found.attempts);
  const entries: ReviewEntry[] = result.rows.map((row) => {
    const ms = row.attempt?.durationMs ?? 0;
    return {
      taskId: row.taskId,
      number: row.number,
      topicName: row.topicName,
      statement: row.statement,
      parts: row.parts,
      choice: row.choice,
      scoring: row.scoring,
      points: row.points,
      earned: row.earned,
      segment: row.segment,
      ms,
      minutesSpent: toMinutes(ms),
      answers: answers[row.taskId] ?? [],
      outcomes: row.attempt?.outcomes ?? [],
    };
  });

  return (
    <div className="flex flex-col gap-6 pt-2 md:gap-8 md:pt-5">
      <ReviewSummary
        review={result}
        variantId={found.test.variantId}
        href={code ? `/v/${code}` : `/variants/${found.test.variantId}`}
        title={
          variant ? await variantTitle(variant, locale) : found.test.variantId
        }
        original={variant?.original}
        finishedAt={found.test.finishedAt}
      >
        {guest && <SignInStrip from="result">{strip("result")}</SignInStrip>}
      </ReviewSummary>
      <ReviewTasks
        tasks={entries}
        timed={result.timed}
        testSessionId={found.test.id}
      />
    </div>
  );
}
