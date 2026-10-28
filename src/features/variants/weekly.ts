import "server-only";
import { sumBy } from "es-toolkit";
import { getTask } from "@/features/catalog/tasks";
import { belgradeDate, dayMs } from "@/lib/dates";
import {
  contentVariants,
  curatedVariants,
  minutesOf,
  pointsOf,
  weeklyVariants,
} from "./variants";

const pool = curatedVariants.length > 0 ? curatedVariants : contentVariants;

export function weeklyVariant(now = new Date()) {
  const day = Date.parse(belgradeDate(now)) / dayMs;
  const weekday = (day + 3) % 7;
  const week = Math.floor((day + 3) / 7);
  const monday = new Date((day - weekday) * dayMs).toISOString().slice(0, 10);
  const variant =
    weeklyVariants.find((v) => v.week === monday) ?? pool[week % pool.length];
  if (!variant) return undefined;
  return {
    id: variant.id,
    week,
    tasks: variant.taskIds.length,
    topics: variant.taskIds.flatMap((id) => {
      const topic = getTask(id)?.topic;
      return topic ? [{ id, topic }] : [];
    }),
    hours: Math.round(minutesOf(variant) / 60),
    points: sumBy(variant.taskIds, pointsOf),
    daysLeft: 7 - weekday,
  };
}

export type WeeklyVariant = NonNullable<ReturnType<typeof weeklyVariant>>;
