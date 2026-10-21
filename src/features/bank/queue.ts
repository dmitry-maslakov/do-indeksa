import "server-only";
import type { Locale } from "next-intl";
import { getTouched } from "@/features/progress/progress";
import type { TaskStatus, Touched } from "@/features/progress/status";
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

async function plan({ topic, profileId, current }: PoolInput, size = 6) {
  const ids = findTasks({ topic }).map((t) => t.id);
  const asked = current && !ids.includes(current) ? [...ids, current] : ids;
  const touched = await getTouched(profileId, asked);
  const queue = planQueue({
    pool: ids.map((id) => ({ id, exam: examYear(id) !== null })),
    touched,
    current,
    size,
  });
  return { touched, queue };
}

export async function nextTask(topic: string, profileId: string) {
  const { queue } = await plan({ topic, profileId }, 1);
  return queue.upcoming[0]?.id;
}

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
