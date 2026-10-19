export const partOutcomes = ["right", "wrong", "empty", "unreadable"] as const;

export type PartOutcome = (typeof partOutcomes)[number];

export const isRight = (outcome: PartOutcome) => outcome === "right";
