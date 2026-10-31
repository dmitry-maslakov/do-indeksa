import { atLeast } from "@/lib/numbers";
import { chance } from "../../ability/elo";
import type { Signal } from "../contracts";

export const hardNeeded: Signal = {
  name: "hardNeeded",
  score: ({ topic, difficulty }, { learning, policy }) => {
    const state = learning.topics.get(topic);
    return state &&
      difficulty >= policy.hardFrom &&
      state.status.missing.includes("cleanHardEnough") &&
      atLeast(
        chance(state.ability, policy.hardFrom, policy),
        policy.hardChanceFrom,
      )
      ? 1
      : 0;
  },
};
