import "server-only";
import { findTasks } from "@/features/bank/search";

const shellsPerTopic = 25;

export function firstTasks(examId: string) {
  const ours = Map.groupBy(
    findTasks(examId, { source: "ours", sort: "easy" }),
    (t) => t.topic,
  );
  return [
    ...findTasks(examId, { source: "exam" }),
    ...[...ours.values()].flatMap((group) => group.slice(0, shellsPerTopic)),
  ];
}
