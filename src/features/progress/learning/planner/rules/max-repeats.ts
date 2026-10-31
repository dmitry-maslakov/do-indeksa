import { isRepeat } from "../../repeats/history";
import type { Rule } from "../contracts";

export const maxRepeats: Rule = {
  allows: ({ taskId }, { learning, picked, policy, now }) =>
    !isRepeat(taskId, learning, now) ||
    picked
      .slice(Math.max(0, picked.length + 1 - policy.repeatsWindow))
      .filter((p) => isRepeat(p.taskId, learning, now)).length <
      policy.maxRepeats,
};
