import { describe, expect, it } from "vitest";
import {
  candidate,
  history,
  learningAt as learningFixture,
} from "@/features/progress/learning/planner/learning.fixture";
import type { Learning, TaskHistory } from "@/features/progress/learning/state";
import { start as now } from "@/features/progress/learning/status/observations.fixture";
import type { Answered, Touch } from "@/features/progress/status";
import { dayMs, minuteMs, secondMs } from "@/lib/dates";
import { planQueue } from "./picks";

const ids = (picks: { id: string }[]) => picks.map((p) => p.id);

interface Answer {
  taskId: string;
  at: number;
  correct: boolean;
}

function generator(seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
  return {
    next,
    int: (below: number) => Math.floor(next() * below),
    pick: <T>(list: T[]) => list[Math.floor(next() * list.length)] as T,
  };
}

function student(seed: number, poolSize: number) {
  const random = generator(seed);
  const names = Array.from({ length: poolSize }, (_, i) => `t${i}`);
  const tasks = names.map((id, i) =>
    candidate(id, ((i % 4) + 1) as 1 | 2 | 3 | 4, i % 5 === 0),
  );
  const answers: Answer[] = [];
  const touches: Touch[] = [];
  const statuses = new Map<string, Answered>();
  const learningAt = (moment: number): Learning => {
    const known = answers.filter((a) => a.at < moment);
    const tries: Record<string, TaskHistory> = {};
    for (const a of known)
      tries[a.taskId] = history({
        dueAt: a.at + (a.correct ? 30 * dayMs : 25 * minuteMs),
        lastResult: a.correct ? "clean" : "wrong",
        lastTryAt: a.at,
      });
    const right = known.filter((a) => a.correct).length;
    return learningFixture(-1.5 + 0.25 * right, [], tries);
  };
  const answer = (taskId: string, when: number) => {
    const correct = random.next() < 0.55;
    answers.push({ taskId, at: when, correct });
    statuses.set(taskId, correct ? "solved" : "wrong");
  };
  names.slice(0, 3).forEach((taskId, i) => {
    const when = now - 10 * dayMs + i * minuteMs;
    touches.push({ taskId, kind: "first", from: when, to: when });
    answer(taskId, when + secondMs);
  });
  const render = (current: string, moment: number) =>
    planQueue({
      pool: tasks,
      learningAt,
      touches,
      statuses,
      now: moment,
      current,
    });
  return { random, names, touches, statuses, answer, render };
}

describe("rows already shown", () => {
  for (const poolSize of [6, 9, 14, 30])
    it(`only move up or leave, and get new rows at the bottom, in a pool of ${poolSize}`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const { random, names, touches, answer, render } = student(
          seed,
          poolSize,
        );
        let clock = now;
        let shown: string[] = [];
        let taken: string[] = [];
        for (let step = 0; step < 14; step++) {
          const gap = random.next() < 0.08 ? 70 : 2 + random.int(19);
          clock += gap * minuteMs;
          const first = render(names[0] as string, clock);
          const rows = ids(first.upcoming);
          const choice = random.next();
          const current =
            choice < 0.4 && rows[0]
              ? rows[0]
              : choice < 0.6 && rows.length
                ? random.pick(rows)
                : choice < 0.7 && taken.length
                  ? random.pick(taken)
                  : random.pick(names);
          const label = `seed ${seed} step ${step}`;
          const before = render(current, clock);
          if (gap < 60 && taken.length) {
            const stay = shown.filter((id) => id !== current);
            expect(ids(before.upcoming).slice(0, stay.length), label).toEqual(
              stay,
            );
          }
          touches.push({
            taskId: current,
            kind: "first",
            from: clock + 2 * secondMs,
            to: clock + 42 * secondMs,
          });
          if (random.next() < 0.6) answer(current, clock + 20 * secondMs);
          const after = render(current, clock + minuteMs);
          expect(ids(after.upcoming), `${label} after the touch`).toEqual(
            ids(before.upcoming),
          );
          expect(
            ids(render(current, clock + 21 * minuteMs).upcoming),
            `${label} on a later reload`,
          ).toEqual(ids(after.upcoming));
          expect(
            after.visit.filter((id) => ids(after.upcoming).includes(id)),
            label,
          ).toEqual([]);
          expect(new Set(after.visit).size, label).toBe(after.visit.length);
          expect(new Set(ids(after.upcoming)).size, label).toBe(
            after.upcoming.length,
          );
          shown = ids(after.upcoming);
          taken = after.visit;
          if (random.next() < 0.15) {
            const tested = random.pick(names);
            const when = clock + 90 * secondMs;
            touches.push({
              taskId: tested,
              kind: "mock",
              from: when,
              to: when,
            });
            answer(tested, when + secondMs);
            shown = shown.filter((id) => id !== tested);
          }
        }
      }
    });
});
