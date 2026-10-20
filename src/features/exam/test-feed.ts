import "server-only";
import type { Locale } from "next-intl";
import { getTests } from "@/features/progress/history";
import { summarizeTests, type TestSummary } from "./test-summaries";

const runsPage = 20;

export interface TestPage {
  tests: TestSummary[];
  next: number | null;
}

export async function testPage(
  profileId: string,
  offset: number,
  locale: Locale,
): Promise<TestPage> {
  const rows = await getTests(profileId, runsPage + 1, offset);
  return {
    tests: await summarizeTests(profileId, rows.slice(0, runsPage), locale),
    next: rows.length > runsPage ? offset + runsPage : null,
  };
}
