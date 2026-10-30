import type { Signal } from "../contracts";

export const examTask: Signal = {
  name: "examTask",
  score: ({ exam }) => (exam ? 1 : 0),
};
