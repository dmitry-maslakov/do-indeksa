import { defaultPolicy } from "../policy";
import type { Learning, TaskHistory, TopicLearning } from "../state";
import { start } from "../status/observations.fixture";
import { type TopicState, topicStatus } from "../status/topic-status";
import type { Difficulty, Observation } from "../types";
import type { Candidate } from "./contracts";

export const logit = (p: number) => Math.log(p / (1 - p));

export const abilityAt = (level: Difficulty, policy = defaultPolicy) =>
  policy.anchors[level] + logit(policy.targetChance);

export const candidate = (
  taskId: string,
  difficulty: Difficulty,
  exam = false,
): Candidate => ({ taskId, topic: "logarithms", difficulty, exam });

export const history = (over: Partial<TaskHistory> = {}): TaskHistory => ({
  topic: "logarithms",
  difficulty: 2,
  lastResult: "wrong",
  dueAt: start,
  tries: 1,
  ...over,
});

export const learningAt = (
  ability: number,
  observations: Observation[] = [],
  tasks: Record<string, TaskHistory> = {},
): Learning => ({
  topics: new Map([
    [
      "logarithms",
      {
        status: topicStatus(
          observations,
          observations.at(-1)?.at ?? null,
          start,
        ),
        ability,
        tasksToday: 0,
        failStreak: 0,
      },
    ],
  ]),
  tasks: new Map(Object.entries(tasks)),
});

interface TopicSetup extends Partial<Omit<TopicLearning, "status">> {
  state?: TopicState;
  almost?: boolean;
  lastAt?: number | null;
}

const topicAt = ({
  state = "notStarted",
  almost = false,
  lastAt = state === "notStarted" ? null : start,
  ...rest
}: TopicSetup = {}): TopicLearning => ({
  status: { state, fill: 0, almost, missing: [], lastAt },
  ability: 0,
  tasksToday: 0,
  failStreak: 0,
  ...rest,
});

export const learningOf = (topics: Record<string, TopicSetup>): Learning => ({
  topics: new Map(
    Object.entries(topics).map(([topic, setup]) => [topic, topicAt(setup)]),
  ),
  tasks: new Map(),
});
