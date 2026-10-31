import { defaultPolicy, type LearningPolicy } from "../policy";
import type { Learning, TaskHistory } from "../state";
import type { TaskLog } from "../types";
import { intervalAfter } from "./schedule";
import { tries } from "./tries";

export function taskHistory(
  log: TaskLog,
  now: number,
  policy: LearningPolicy = defaultPolicy,
): TaskHistory | undefined {
  const all = tries(log, now, policy);
  const last = all.at(-1);
  if (!last) return;
  return {
    topic: log.topic,
    difficulty: log.difficulty,
    lastResult: last.result,
    dueAt: last.at + intervalAfter(all, policy),
    tries: all.length,
  };
}

export const isDue = (task: TaskHistory | undefined, now: number) =>
  task !== undefined && task.dueAt <= now;

export function isRepeat(taskId: string, learning: Learning, now: number) {
  const task = learning.tasks.get(taskId);
  return isDue(task, now) || (task?.tries ?? 0) > 1;
}
