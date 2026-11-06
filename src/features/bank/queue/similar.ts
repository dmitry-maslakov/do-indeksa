import type { Candidate } from "@/features/progress/learning/planner/contracts";
import type { TaskStatuses } from "@/features/progress/status";

const nearby = 1;

export function similarPool(
  task: Candidate,
  pool: Candidate[],
  statuses: TaskStatuses,
) {
  const open = pool.filter(
    (t) => t.taskId !== task.taskId && statuses.get(t.taskId) !== "solved",
  );
  const sameType = (t: Candidate) => t.type === task.type;
  const near = (t: Candidate) =>
    Math.abs(t.difficulty - task.difficulty) <= nearby;
  return (
    [
      open.filter((t) => sameType(t) && near(t)),
      open.filter(sameType),
      open.filter(near),
      open,
    ].find((tier) => tier.length > 0) ?? []
  );
}
