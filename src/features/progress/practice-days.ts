import { sumBy } from "es-toolkit";
import { dateIn, dayMs } from "@/lib/dates";

export interface PracticeSpan {
  at: number;
  tz: string | null;
  ms: number;
}

export interface PracticeDay {
  day: string;
  ms: number;
  active: boolean;
  future: boolean;
}

export interface Regularity {
  weeks: PracticeDay[][];
  days: number;
  ms: number;
}

export const practiceWeeks = 8;

export const practiceMonths = 6;

export const gridWeeks = Math.round((practiceMonths * 365) / 12 / 7);

const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / dayMs;

const dayAt = (n: number) => new Date(n * dayMs).toISOString().slice(0, 10);

const shift = (day: string, days: number) => dayAt(dayNumber(day) + days);

export const mondayOf = (day: string) =>
  shift(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));

function practiceDays(spans: PracticeSpan[]) {
  const days = new Map<string, number>();
  for (const { at, tz, ms } of spans) {
    const day = dateIn(at, tz);
    days.set(day, (days.get(day) ?? 0) + ms);
  }
  return days;
}

export function regularity(
  spans: PracticeSpan[],
  today: string,
  weekCount: number,
): Regularity {
  const days = practiceDays(spans);
  const monday = mondayOf(today);
  const weeks = Array.from({ length: weekCount }, (_, w) => {
    const start = shift(monday, (w - weekCount + 1) * 7);
    return Array.from({ length: 7 }, (_, d) => {
      const day = shift(start, d);
      return {
        day,
        ms: days.get(day) ?? 0,
        active: days.has(day),
        future: day > today,
      };
    });
  });
  const shown = weeks.flat();
  return {
    weeks,
    days: shown.filter((d) => d.active).length,
    ms: sumBy(shown, (d) => d.ms),
  };
}

export function streakOf(days: Set<string>, today: string) {
  let streak = 0;
  let cursor = days.has(today) ? today : shift(today, -1);
  while (days.has(cursor)) {
    streak++;
    cursor = shift(cursor, -1);
  }
  return streak;
}
