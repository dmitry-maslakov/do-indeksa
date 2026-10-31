import "server-only";
import { nextTasks, topicStart } from "@/features/bank/queue/queue";
import { recommendationOf } from "@/features/bank/queue/recommendation";
import { getTaskStatuses } from "@/features/progress/progress";
import { getProfileId } from "@/server/profile";

export async function loadPersonal(topic: string) {
  const profileId = await getProfileId();
  const [statuses, starts] = await Promise.all([
    getTaskStatuses(profileId),
    nextTasks(profileId),
  ]);
  return {
    statuses,
    pick: {
      href: topicStart(starts, topic),
      recommendation: recommendationOf("bank_tab", topic, starts.get(topic)),
    },
  };
}
