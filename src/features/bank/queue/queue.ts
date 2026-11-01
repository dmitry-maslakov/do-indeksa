import "server-only";
import { findTasks } from "@/features/bank/search";
import { positions } from "@/features/catalog/exams";
import { type Level, levelOf } from "@/features/catalog/level";
import { getTask } from "@/features/catalog/tasks";
import type { Candidate } from "@/features/progress/learning/planner/contracts";
import { difficultyOf } from "@/features/progress/learning/types";
import {
  getOutcomes,
  getTouched,
  getVisitStatuses,
  getZone,
} from "@/features/progress/progress";
import type { Answered, TouchStatus } from "@/features/progress/status";
import { getTimeline } from "@/features/progress/student-learning";
import { timeZone } from "@/lib/dates";
import { earlierCount, earlierGroups, type Period } from "./earlier";
import { type Pick, planQueue, startSize, upcomingSize } from "./picks";
import type { PickReason } from "./recommendation";
import { examYear, previewHtml } from "./task-preview";
import { visitOf } from "./visit";

export interface QueueRow {
  id: string;
  html: string;
  label: string;
  year: number | null;
  level: Level;
  status?: TouchStatus;
  repeat?: boolean;
  reason?: PickReason;
}

export type Before = Answered | "repeat";

export interface Queue {
  next?: string;
  before?: Before;
  earlier: number;
  visit: QueueRow[];
  upcoming: QueueRow[];
}

export interface EarlierGroup {
  key: string;
  period: Period;
  rows: QueueRow[];
}

export interface Earlier {
  tz: string;
  groups: EarlierGroup[];
}

interface PoolInput {
  topic: string;
  profileId: string;
  current?: string;
}

const topicIds = (topic: string) => findTasks({ topic }).map((t) => t.id);

const poolOf = (ids: string[]) =>
  ids.flatMap((id): Candidate[] => {
    const task = getTask(id);
    if (!task) return [];
    return [
      {
        taskId: id,
        topic: task.topic,
        type: task.type,
        difficulty: difficultyOf(task.difficulty),
        exam: examYear(id) !== null,
      },
    ];
  });

async function plan({ topic, profileId, current }: PoolInput) {
  const ids = topicIds(topic);
  const asked = current && !ids.includes(current) ? [...ids, current] : ids;
  const [touched, { now, learningAt }] = await Promise.all([
    getTouched(profileId, asked),
    getTimeline(profileId),
  ]);
  const queue = planQueue({
    pool: poolOf(ids),
    learningAt,
    ...touched,
    now,
    current,
  });
  return { touched, queue, now };
}

const rowOf = (id: string, status?: TouchStatus): QueueRow[] => {
  const task = getTask(id);
  if (!task) return [];
  return [
    {
      id,
      html: previewHtml(id),
      label: task.preview.replaceAll("$", ""),
      year: examYear(id),
      level: levelOf(task.difficulty),
      status,
    },
  ];
};

export async function nextTasks(profileId: string) {
  const topics = positions.map(({ topic }) => ({
    topic,
    ids: topicIds(topic),
  }));
  const [{ touches, statuses }, { now, learningAt }] = await Promise.all([
    getTouched(profileId),
    getTimeline(profileId),
  ]);
  return new Map(
    topics.flatMap(({ topic, ids }) => {
      const own = new Set(ids);
      const mine = touches.filter((t) => own.has(t.taskId));
      const { upcoming } = planQueue({
        pool: poolOf(ids),
        learningAt,
        touches: mine,
        statuses,
        now,
        size: visitOf(mine, now).length ? upcomingSize : startSize,
      });
      const next = upcoming[0] ?? (ids[0] && { id: ids[0] });
      return next ? [[topic, next] as const] : [];
    }),
  );
}

export const topicStart = (
  starts: Map<string, { id: string }>,
  topic: string,
) => `/bank/${starts.get(topic)?.id ?? `start/${topic}`}`;

export async function loadQueue(input: PoolInput): Promise<Queue> {
  const { touched, queue, now } = await plan(input);
  const { current, profileId, topic } = input;
  const [statuses, outcomes, zone] = await Promise.all([
    getVisitStatuses(profileId, queue.visit, queue.begun),
    getOutcomes(profileId, topicIds(topic)),
    getZone(profileId),
  ]);
  const beforeOf = (id: string): Before | undefined => {
    if (queue.repeated.includes(id)) return "repeat";
    return queue.returning ? touched.statuses.get(id) : undefined;
  };
  const row = (id: string, pick?: Pick) =>
    rowOf(id, statuses.get(id)).map((r) => ({
      ...r,
      repeat: pick?.repeat ?? queue.repeated.includes(id),
      reason: pick?.reason,
    }));
  return {
    next: queue.upcoming[0]?.id,
    before: current === undefined ? undefined : beforeOf(current),
    earlier: earlierCount(earlierGroups(touched.touches, outcomes, now, zone)),
    visit: queue.visit.flatMap((id) => row(id)),
    upcoming: queue.upcoming.flatMap((p) => row(p.id, p)),
  };
}

export async function loadEarlier(
  profileId: string,
  topic: string,
): Promise<Earlier> {
  const ids = topicIds(topic);
  const [{ touches }, outcomes, zone] = await Promise.all([
    getTouched(profileId, ids),
    getOutcomes(profileId, ids),
    getZone(profileId),
  ]);
  const groups = earlierGroups(touches, outcomes, Date.now(), zone);
  return {
    tz: zone ?? timeZone,
    groups: groups.map(({ key, period, tasks }) => ({
      key,
      period,
      rows: tasks.flatMap((t) => rowOf(t.id, t.result)),
    })),
  };
}
