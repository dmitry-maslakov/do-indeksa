import "server-only";
import type { Locale } from "next-intl";
import { getRuns } from "@/features/progress/history";
import { type RunSummary, summarizeRuns } from "./run-summaries";

const runsPage = 20;

export interface RunPage {
  runs: RunSummary[];
  next: number | null;
}

export async function runPage(
  profileId: string,
  offset: number,
  locale: Locale,
): Promise<RunPage> {
  const rows = await getRuns(profileId, runsPage + 1, offset);
  return {
    runs: await summarizeRuns(profileId, rows.slice(0, runsPage), locale),
    next: rows.length > runsPage ? offset + runsPage : null,
  };
}
