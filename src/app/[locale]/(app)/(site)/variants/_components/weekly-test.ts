import { getLocale } from "next-intl/server";
import { summarizeWeekly } from "@/features/tests/summaries";
import type { WeeklyVariant } from "@/features/variants/weekly";
import { getProfileId } from "@/server/profile";

export async function loadWeeklyTest(weekly: WeeklyVariant) {
  return summarizeWeekly(await getProfileId(), weekly, await getLocale());
}
