import { io } from "next/cache";
import { WeeklyCard } from "@/features/tests/weekly/weekly-card";
import { weeklyVariant } from "@/features/variants/weekly";
import { loadLatest } from "./catalog-tab";

export async function Weekly() {
  await io();
  const weekly = weeklyVariant();
  if (!weekly) return null;
  const tests = await loadLatest([weekly.id]);
  const test = tests.find(
    (r) => weeklyVariant(new Date(r.finishedAt))?.week === weekly.week,
  );
  return <WeeklyCard {...weekly} test={test} />;
}
