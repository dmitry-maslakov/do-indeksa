import "server-only";
import type { Locale } from "next-intl";
import { positions } from "@/features/catalog/exams";
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
import type { Page } from "@/lib/use-feed";
import { getLatestTests, getTestAttempts, getTests } from "./finished-tests";
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
  examTasks: number;
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
        examTasks: positions.length,
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

const pageSize = 20;

export async function testPage(
  profileId: string,
  offset: number,
  locale: Locale,
): Promise<Page<TestSummary>> {
  const rows = await getTests(profileId, pageSize + 1, offset);
  return {
    items: await summarizeTests(profileId, rows.slice(0, pageSize), locale),
    next: rows.length > pageSize ? offset + pageSize : null,
  };
}

export async function summarizeLatest(
  profileId: string,
  variantIds: string[],
  locale: Locale,
) {
  return summarizeTests(
    profileId,
    await getLatestTests(profileId, variantIds),
    locale,
  );
}
