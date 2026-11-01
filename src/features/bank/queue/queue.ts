import "server-only";
import type { Locale } from "next-intl";
import { findTasks } from "@/features/bank/search";
import { positions } from "@/features/catalog/exams";
import { getTask } from "@/features/catalog/tasks";
import { topicName } from "@/features/catalog/topics";
import type { Candidate } from "@/features/progress/learning/planner/contracts";
import { difficultyOf } from "@/features/progress/learning/types";
import { getTouched } from "@/features/progress/progress";
import {
  type Answered,
  isAnswered,
  type TouchStatus,
} from "@/features/progress/status";
import { getTimeline } from "@/features/progress/student-learning";
import { type Pick, planQueue, upcomingSize } from "./picks";
import type { PickReason } from "./recommendation";
import { examYear, previewHtml } from "./task-preview";
import { visitOf } from "./visit";

export interface QueueRow {
  id: string;
  html: string;
  label: string;
  topic: string;
  year: number | null;
  status?: TouchStatus;
  repeat?: boolean;
  reason?: PickReason;
}

export interface Queue {
  next?: string;
  before?: Answered;
  visit: QueueRow[];
  upcoming: QueueRow[];
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
        size: visitOf(mine, now).length ? upcomingSize : 1,
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

export async function loadQueue(
  input: PoolInput & { locale: Locale },
): Promise<Queue> {
  const { touched, queue, now } = await plan(input);
  const row = (id: string, pick?: Pick): QueueRow[] => {
    const task = getTask(id);
    if (!task) return [];
    return [
      {
        id,
        html: previewHtml(id),
        label: task.preview.replaceAll("$", ""),
        topic: topicName(task.topic, input.locale),
        year: examYear(id),
        status: touched.statuses.get(id),
        repeat: pick?.repeat,
        reason: pick?.reason,
      },
    ];
  };
  const { current } = input;
  const returning =
    current !== undefined &&
    !visitOf(touched.touches, now).some((t) => t.taskId === current);
  const earlier = returning ? touched.statuses.get(current) : undefined;
  return {
    next: queue.upcoming[0]?.id,
    before: isAnswered(earlier) ? earlier : undefined,
    visit: queue.visit.flatMap((id) => row(id)),
    upcoming: queue.upcoming.flatMap((p) => row(p.id, p)),
  };
}
