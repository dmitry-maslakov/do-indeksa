import "server-only";
import { loadQueue, nextTasks, topicStart } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { examOf } from "@/features/catalog/exams";
import { getSolved } from "@/features/progress/progress";
import { getSittingState } from "@/features/progress/sitting";
import { getSession } from "@/server/auth";
import { getProfileId } from "@/server/profile";

interface PersonalInput {
  examId: string;
  id: string;
  topic: string;
}

async function solvedBefore(profileId: string, id: string) {
  if (await getSession()) return undefined;
  const solved = await getSolved(profileId);
  return solved.filter((s) => s.taskId !== id).length + 1;
}

export async function loadPersonal({ examId, id, topic }: PersonalInput) {
  const profileId = await getProfileId();
  const [queue, starts, solved] = await Promise.all([
    loadQueue({ topic, profileId, examId, current: id }),
    nextTasks(profileId, examId),
    solvedBefore(profileId, id),
  ]);
  return {
    queue,
    starts: Object.fromEntries(
      examOf(examId).topics.map((topic) => [topic, topicStart(starts, topic)]),
    ),
    next: {
      href: queue.next && `/bank/${queue.next}`,
      recommendation: recommendationOf("next", topic, queue.upcoming[0]),
    },
    solved,
  };
}

export async function loadSitting(id: string) {
  return getSittingState(await getProfileId(), id);
}
