import "server-only";
import type { Locale } from "next-intl";
import { getAttempted } from "@/features/progress/progress";
import type { Attempted, TaskStatus } from "@/features/progress/status";
import { getTask } from "@/features/tasks/tasks";
import { topicName } from "@/features/tasks/topics";
import { planQueue } from "./picks";
import { examYear, previewHtml } from "./rail-task";
import { findTasks } from "./search";

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
  before?: Attempted["status"];
  earlier: QueueRow[];
  today: QueueRow[];
  upcoming: QueueRow[];
}

interface PoolInput {
  topic: string;
  userId?: string;
  current?: string;
}

async function plan({ topic, userId, current }: PoolInput, size = 6) {
  const ids = findTasks({ topic }).map((t) => t.id);
  const asked = current && !ids.includes(current) ? [...ids, current] : ids;
  const attempts = userId
    ? await getAttempted(userId, asked)
    : new Map<string, Attempted>();
  const queue = planQueue({
    pool: ids.map((id) => ({ id, exam: examYear(id) !== null })),
    attempts,
    current,
    ordered: !userId,
    size,
  });
  return { attempts, queue };
}

export async function nextTask(topic: string, userId?: string) {
  const { queue } = await plan({ topic, userId }, 1);
  return queue.upcoming[0]?.id;
}

export async function loadQueue(
  input: PoolInput & { locale: Locale },
): Promise<Queue> {
  const { attempts, queue } = await plan(input);
  const row = (id: string, repeat?: boolean): QueueRow[] => {
    const task = getTask(id);
    if (!task) return [];
    return [
      {
        id,
        html: previewHtml(id),
        topic: topicName(task.topic, input.locale),
        year: examYear(id),
        status: attempts.get(id)?.status,
        repeat,
      },
    ];
  };
  const before = input.current ? attempts.get(input.current) : undefined;
  return {
    next: queue.upcoming[0]?.id,
    before: before && !before.today ? before.status : undefined,
    earlier: queue.earlier.flatMap((id) => row(id)),
    today: queue.today.flatMap((id) => row(id)),
    upcoming: queue.upcoming.flatMap((p) => row(p.id, p.repeat)),
  };
}
