import "server-only";
import type { Locale } from "next-intl";
import { loadQueue, nextTasks, topicStart } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { positions } from "@/features/catalog/exams";
import { getSolved } from "@/features/progress/progress";
import { getSittingState } from "@/features/progress/sitting";
import { getSession } from "@/server/auth";
import { getProfileId } from "@/server/profile";

interface PersonalInput {
  id: string;
  topic: string;
  locale: Locale;
}

async function solvedBefore(profileId: string, id: string) {
  if (await getSession()) return undefined;
  const solved = await getSolved(profileId);
  return solved.filter((s) => s.taskId !== id).length + 1;
}

export async function loadPersonal({ id, topic, locale }: PersonalInput) {
  const profileId = await getProfileId();
  const [queue, starts, solved, sitting] = await Promise.all([
    loadQueue({ topic, profileId, current: id, locale }),
    nextTasks(profileId),
    solvedBefore(profileId, id),
    getSittingState(profileId, id),
  ]);
  return {
    queue,
    starts: Object.fromEntries(
      positions.map((p) => [p.topic, topicStart(starts, p.topic)]),
    ),
    next: {
      href: queue.next && `/bank/${queue.next}`,
      recommendation: recommendationOf("next", topic, queue.upcoming[0]),
    },
    solved,
    sitting,
  };
}
