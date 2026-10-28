export const levels = ["easy", "medium", "hard"] as const;

export type Level = (typeof levels)[number];

export const levelOf = (difficulty: number): Level =>
  difficulty <= 2 ? "easy" : difficulty === 3 ? "medium" : "hard";
