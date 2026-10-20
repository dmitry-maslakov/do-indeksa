import "server-only";
import type { Locale } from "next-intl";
import { getTestAttempts } from "@/features/progress/history";
import { review } from "@/features/review/review";
import type { TopicLook } from "@/features/tasks/topic-look";
import { topicLook } from "@/features/tasks/topics";
import type { Segment } from "@/lib/strip";
import { variantTitle } from "./variant-title";
import { type ExamVariant, getVariant, reviewTasks } from "./variants";
import { weeklyVariant } from "./weekly";

export interface TestRow {
  id: string;
  variantId: string;
  taskIds: string[];
  finishedAt: Date;
}

type TestKind = ExamVariant["kind"] | "weekly";

export interface TestSummary {
  id: string;
  variantId: string;
  kind: TestKind;
  title: string;
  finishedAt: number;
  segments: Segment[];
  looks: TopicLook[];
  misses: number[];
  score: number;
  max: number;
}

export async function summarizeTests(
  profileId: string,
  tests: TestRow[],
  locale: Locale,
): Promise<TestSummary[]> {
  const attempts = await getTestAttempts(
    profileId,
    tests.map((test) => test.id),
  );
  const byTest = Map.groupBy(attempts, (a) => a.testId);
  return Promise.all(
    tests.map(async (test) => {
      const variant = getVariant(test.variantId);
      const result = review(
        reviewTasks(test.taskIds),
        byTest.get(test.id) ?? [],
      );
      const weekly = weeklyVariant(test.finishedAt)?.id === test.variantId;
      return {
        id: test.id,
        variantId: test.variantId,
        kind: weekly ? "weekly" : (variant?.kind ?? "custom"),
        title: variant ? await variantTitle(variant, locale) : test.variantId,
        finishedAt: test.finishedAt.getTime(),
        segments: result.rows.map((r) => r.segment),
        looks: result.rows.map((r) => topicLook(r.topic)),
        misses: result.rows
          .filter((r) => r.earned < r.points)
          .map((r) => r.number),
        score: result.score,
        max: result.max,
      };
    }),
  );
}
