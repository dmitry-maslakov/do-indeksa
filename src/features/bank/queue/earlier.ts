import { sumBy, uniq } from "es-toolkit";
import type { Outcome, Result, Touch } from "@/features/progress/status";
import { dateIn, dayMs } from "@/lib/dates";
import { earlierRuns, visitOf } from "./visit";

export type Period =
  | { kind: "today" | "yesterday"; at: number }
  | { kind: "day"; day: string }
  | { kind: "week"; from: string; to: string };

export interface Group {
  key: string;
  period: Period;
  tasks: { id: string; result: Result }[];
}

const sessionDays = 2;

const weekDays = 7;

const lastWeekDay = weekDays - 1;

const dayNumber = (day: string) => Date.parse(day) / dayMs;

const dateOf = (day: number) =>
  new Date(day * dayMs).toISOString().slice(0, 10);

export function periodOf(at: number, now: number, tz?: string | null): Period {
  const day = dateIn(at, tz);
  const today = dayNumber(dateIn(now, tz));
  const ago = today - dayNumber(day);
  if (ago < sessionDays) return { kind: ago ? "yesterday" : "today", at };
  if (ago < weekDays) return { kind: "day", day };
  const weekday = (new Date(day).getUTCDay() + lastWeekDay) % weekDays;
  const monday = dayNumber(day) - weekday;
  return {
    kind: "week",
    from: dateOf(monday),
    to: dateOf(Math.min(monday + lastWeekDay, today - weekDays)),
  };
}

const keyOf = (period: Period) => {
  if (period.kind === "week") return period.from;
  return period.kind === "day" ? period.day : String(period.at);
};

const resultOf = (outcomes: Outcome[]) =>
  outcomes.findLast((o) => o.result !== "revealed")?.result ??
  outcomes[0]?.result;

interface Span {
  period: Period;
  touches: Touch[];
  outcomes: Outcome[];
}

export function earlierGroups(
  touches: Touch[],
  outcomes: Outcome[],
  now: number,
  tz: string | null,
): Group[] {
  const begun = visitOf(touches, now)[0]?.from ?? now;
  const spans = new Map<string, Span>();
  const starts = earlierRuns(touches, now).map((run) => {
    const from = run[0]?.from ?? now;
    const period = periodOf(from, now, tz);
    const span = spans.get(keyOf(period)) ?? {
      period,
      touches: [],
      outcomes: [],
    };
    span.touches.push(...run);
    spans.set(keyOf(period), span);
    return { from, span };
  });
  for (const outcome of outcomes)
    if (outcome.at < begun)
      starts
        .findLast(({ from }) => from <= outcome.at)
        ?.span.outcomes.push(outcome);
  return [...spans].flatMap(([key, span]) => {
    const tasks = uniq(span.touches.map((t) => t.taskId)).flatMap((id) => {
      const result = resultOf(span.outcomes.filter((o) => o.taskId === id));
      return result ? { id, result } : [];
    });
    return tasks.length ? { key, period: span.period, tasks } : [];
  });
}

export const earlierCount = (groups: Group[]) =>
  sumBy(groups, (g) => g.tasks.length);
