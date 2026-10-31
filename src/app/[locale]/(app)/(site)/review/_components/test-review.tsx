import { getLocale, getTranslations } from "next-intl/server";
import { SignInStrip } from "@/features/account/sign-in-strip";
import { comparisonsOf } from "@/features/tests/comparisons";
import type { getTest } from "@/features/tests/finished-tests";
import { review } from "@/features/tests/review";
import { findSetCode } from "@/features/variants/custom/sets";
import { variantTitle } from "@/features/variants/variant-title";
import { getVariant, tasksFor } from "@/features/variants/variants";
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
  const variant = getVariant(found.test.variantId);
  const [tasks, code] = await Promise.all([
    tasksFor(found.test.taskIds, locale),
    variant?.kind === "custom" && findSetCode(variant.taskIds),
  ]);
  const result = review(tasks, found.attempts);

  return (
    <div className="flex flex-col gap-10 pt-2 md:gap-12 md:pt-5">
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
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14">
        <ReviewRows
          review={result}
          comparisons={comparisonsOf(found.attempts)}
          testSessionId={found.test.id}
        />
        <TimeSpent review={result} />
      </div>
    </div>
  );
}
