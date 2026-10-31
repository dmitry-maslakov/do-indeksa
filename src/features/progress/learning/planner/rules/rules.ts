import type { Rule } from "../contracts";
import { maxRepeats } from "./max-repeats";
import { repeatLevelCap } from "./repeat-level-cap";

export const rules: Rule[] = [maxRepeats, repeatLevelCap];
