import "server-only";
import { findTasks } from "@/features/bank/search";

const shellsPerTopic = 25;

export function firstTasks() {
  const ours = Map.groupBy(
    findTasks({ source: "ours", sort: "easy" }),
    (t) => t.topic,
  );
  return [
    ...findTasks({ source: "exam" }),
    ...[...ours.values()].flatMap((group) => group.slice(0, shellsPerTopic)),
  ];
}
