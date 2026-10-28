import "server-only";
import type { Locale } from "next-intl";
import type { TopicLook } from "@/features/catalog/topic-look";
import { topicLook } from "@/features/catalog/topics";
import { variantTitle } from "@/features/variants/variant-title";
import {
  type ExamVariant,
  getVariant,
  slotsOf,
} from "@/features/variants/variants";
import { weeklyVariant } from "@/features/variants/weekly";
import type { Segment } from "@/lib/strip";
import { getTestAttempts } from "./history";
import { review } from "./review";

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
      const result = review(slotsOf(test.taskIds), byTest.get(test.id) ?? []);
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
