import { isDue } from "../../repeats/history";
import type { Signal } from "../contracts";

export const repeatDue: Signal = {
  name: "repeatDue",
  score: ({ taskId }, { learning, policy, now }) => {
    const task = learning.tasks.get(taskId);
    if (!task || !isDue(task, now)) return 0;
    const overdueMs = now - task.dueAt;
    return (
      policy.repeatPriority[task.lastResult] +
      (policy.overdueExtra * overdueMs) / (overdueMs + policy.overdueHalfMs)
    );
  },
};
