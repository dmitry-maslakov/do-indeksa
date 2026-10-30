import { chance } from "../../ability/elo";
import type { Signal } from "../contracts";

export const levelFit: Signal = {
  name: "levelFit",
  score: ({ topic, difficulty }, { learning, policy }) => {
    const ability = learning.get(topic)?.ability;
    if (ability === undefined) return 0;
    const { targetChance } = policy;
    return (
      1 -
      Math.abs(chance(ability, difficulty, policy) - targetChance) /
        targetChance
    );
  },
};
