import { io } from "next/cache";
import { weeklyVariant } from "@/features/variants/weekly";
import { loadLatest } from "./catalog-tab";
import { WeekCard } from "./week-card";

export async function Weekly() {
  await io();
  const weekly = weeklyVariant();
  if (!weekly) return null;
  const tests = await loadLatest([weekly.id]);
  const test = tests.find(
    (r) => weeklyVariant(new Date(r.finishedAt))?.week === weekly.week,
  );
  return <WeekCard {...weekly} test={test} />;
}
