import { dateIn } from "@/lib/dates";
import { levelAt } from "../../ability/elo";
import type { LearningPolicy } from "../../policy";
import { isDue, isRepeat } from "../../repeats/history";
import type { TaskHistory } from "../../state";
import type { PlanContext, Rule } from "../contracts";

const isNear = (difficulty: number, level: number, policy: LearningPolicy) =>
  difficulty - level <= policy.repeatLevelsAbove;

const repeatedToday = (task: TaskHistory, now: number) =>
  task.tries > 1 && dateIn(task.lastTryAt, task.tz) === dateIn(now, task.tz);

const nearDueLeft = (topic: string, level: number, context: PlanContext) =>
  context.candidates.some(
    (c) =>
      c.topic === topic &&
      isNear(c.difficulty, level, context.policy) &&
      isDue(context.learning.tasks.get(c.taskId), context.now),
  );

const stretchedToday = (topic: string, level: number, context: PlanContext) =>
  [...context.learning.tasks.values()].some(
    (task) =>
      task.topic === topic &&
      !isNear(task.difficulty, level, context.policy) &&
      repeatedToday(task, context.now),
  ) ||
  context.picked.some(
    (p) =>
      p.topic === topic &&
      !isNear(p.difficulty, level, context.policy) &&
      isRepeat(p.taskId, context.learning, context.now),
  );

export const repeatLevelCap: Rule = {
  allows: ({ taskId, topic, difficulty }, context) => {
    const { learning, policy, now } = context;
    const state = learning.topics.get(topic);
    if (!state || !isRepeat(taskId, learning, now)) return true;
    const level = levelAt(state.ability, policy);
    return (
      isNear(difficulty, level, policy) ||
      (difficulty - level <= policy.stretchLevelsAbove &&
        !nearDueLeft(topic, level, context) &&
        !stretchedToday(topic, level, context))
    );
  },
};
