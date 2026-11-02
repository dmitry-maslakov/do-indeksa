import { io } from "next/cache";
import { getLocale } from "next-intl/server";
import { summarizeWeekly } from "@/features/tests/summaries";
import { WeeklyCard } from "@/features/tests/weekly/weekly-card";
import { weeklyVariant } from "@/features/variants/weekly";
import { getProfileId } from "@/server/profile";

export async function Weekly() {
  await io();
  const weekly = weeklyVariant();
  if (!weekly) return null;
  const test = await summarizeWeekly(
    await getProfileId(),
    weekly,
    await getLocale(),
  );
  return <WeeklyCard {...weekly} test={test} />;
}
