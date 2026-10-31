import { levelAt } from "../../ability/elo";
import type { LearningPolicy } from "../../policy";
import { isDue, isRepeat } from "../../repeats/history";
import type { PlanContext, Rule } from "../contracts";

const isNear = (difficulty: number, level: number, policy: LearningPolicy) =>
  difficulty - level <= policy.repeatLevelsAbove;

const nearDueLeft = (topic: string, level: number, context: PlanContext) =>
  [...context.learning.tasks].some(
    ([id, task]) =>
      task.topic === topic &&
      isNear(task.difficulty, level, context.policy) &&
      isDue(task, context.now) &&
      !context.picked.some((p) => p.taskId === id),
  );

const stretchedToday = (topic: string, level: number, context: PlanContext) =>
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
