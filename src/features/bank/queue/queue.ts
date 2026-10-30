import "server-only";
import type { Locale } from "next-intl";
import { findTasks } from "@/features/bank/search";
import { positions } from "@/features/catalog/exams";
import { getTask } from "@/features/catalog/tasks";
import { topicName } from "@/features/catalog/topics";
import { getTouched } from "@/features/progress/progress";
import type { TaskStatus, Touched } from "@/features/progress/status";
import { planQueue } from "./picks";
import { examYear, previewHtml } from "./task-preview";

export interface QueueRow {
  id: string;
  html: string;
  topic: string;
  year: number | null;
  status?: TaskStatus;
  repeat?: boolean;
}

export interface Queue {
  next?: string;
  before?: Touched["status"];
  earlier: QueueRow[];
  today: QueueRow[];
  upcoming: QueueRow[];
}

interface PoolInput {
  topic: string;
  profileId: string;
  current?: string;
}

const topicIds = (topic: string) => findTasks({ topic }).map((t) => t.id);

const poolOf = (ids: string[]) =>
  ids.map((id) => ({ id, exam: examYear(id) !== null }));

async function plan({ topic, profileId, current }: PoolInput, size = 6) {
  const ids = topicIds(topic);
  const asked = current && !ids.includes(current) ? [...ids, current] : ids;
  const touched = await getTouched(profileId, asked);
  const queue = planQueue({ pool: poolOf(ids), touched, current, size });
  return { touched, queue };
}

export async function nextTasks(profileId: string) {
  const topics = positions.map(({ topic }) => ({
    topic,
    ids: topicIds(topic),
  }));
  const touched = await getTouched(
    profileId,
    topics.flatMap((t) => t.ids),
  );
  return new Map(
    topics.flatMap(({ topic, ids }) => {
      const own = new Set(ids);
      const { upcoming } = planQueue({
        pool: poolOf(ids),
        touched: new Map([...touched].filter(([id]) => own.has(id))),
        size: 1,
      });
      const next = upcoming[0] ?? (ids[0] && { id: ids[0], fallback: true });
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
  const { touched, queue } = await plan(input);
  const row = (id: string, repeat?: boolean): QueueRow[] => {
    const task = getTask(id);
    if (!task) return [];
    return [
      {
        id,
        html: previewHtml(id),
        topic: topicName(task.topic, input.locale),
        year: examYear(id),
        status: touched.get(id)?.status,
        repeat,
      },
    ];
  };
  const before = input.current ? touched.get(input.current) : undefined;
  return {
    next: queue.upcoming[0]?.id,
    before: before && !before.today ? before.status : undefined,
    earlier: queue.earlier.flatMap((id) => row(id)),
    today: queue.today.flatMap((id) => row(id)),
    upcoming: queue.upcoming.flatMap((p) => row(p.id, p.repeat)),
  };
}
