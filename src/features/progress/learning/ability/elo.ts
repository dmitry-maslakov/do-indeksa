import { defaultPolicy, type LearningPolicy } from "../policy";
import type { Difficulty, Observation } from "../types";

export const chance = (
  ability: number,
  difficulty: Difficulty,
  { anchors }: LearningPolicy = defaultPolicy,
) => 1 / (1 + Math.exp(anchors[difficulty] - ability));

const stepOf = (
  evidence: number,
  { stepBase, stepDecay, stepFloor }: LearningPolicy,
) => Math.max(stepFloor, stepBase / (1 + stepDecay * evidence));

const decayed = (
  evidence: number,
  sinceMs: number,
  { evidenceHalfLifeMs }: LearningPolicy,
) => evidence * 0.5 ** (sinceMs / evidenceHalfLifeMs);

export function abilityOf(
  observations: Observation[],
  start: number,
  policy: LearningPolicy = defaultPolicy,
) {
  return observations
    .toSorted((a, b) => a.at - b.at)
    .reduce(
      (state, o) => {
        const evidence = decayed(state.evidence, o.at - state.lastAt, policy);
        const step = stepOf(evidence, policy);
        return {
          ability:
            state.ability +
            step * (o.credit - chance(state.ability, o.difficulty, policy)),
          evidence: evidence + 1,
          lastAt: o.at,
        };
      },
      { ability: start, evidence: 0, lastAt: -Infinity },
    ).ability;
}
