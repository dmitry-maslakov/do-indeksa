import { getLocale, getTranslations } from "next-intl/server";
import { SignInStrip } from "@/features/account/sign-in-strip";
import { comparisonsOf } from "@/features/tests/comparisons";
import type { getTest } from "@/features/tests/finished-tests";
import { review } from "@/features/tests/review";
import { variantTitle } from "@/features/variants/variant-title";
import { getVariant, tasksFor } from "@/features/variants/variants";
import { LostPoints } from "./lost-points";
import { ReviewRows } from "./review-rows";
import { ReviewSummary } from "./review-summary";
import { TimeSpent } from "./time-spent";

export async function TestReview({
  found,
  guest,
}: {
  found: NonNullable<Awaited<ReturnType<typeof getTest>>>;
  guest: boolean;
}) {
  const locale = await getLocale();
  const strip = await getTranslations("SignInStrip");
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
      >
        {guest && <SignInStrip from="result">{strip("result")}</SignInStrip>}
      </ReviewSummary>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14">
        <ReviewRows
          review={result}
          comparisons={comparisonsOf(found.attempts)}
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
