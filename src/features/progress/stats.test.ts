import { describe, expect, it } from "vitest";
import { weakest } from "./stats";

const stat = (
  taskId: string,
  topic: string,
  attempts: number,
  right: number,
) => ({
  taskId,
  topic,
  attempts,
  right,
});

describe("weak topics", () => {
  const stats = [
    stat("x1", "x", 2, 1),
    stat("x2", "x", 1, 0),
    stat("y1", "y", 3, 3),
    stat("z1", "z", 1, 0),
  ];

  it("ranks the weakest topics with enough recent attempts", () => {
    expect(weakest(stats, ["w", "x", "y", "z"])).toEqual([
      { topic: "x", pct: 33 },
      { topic: "y", pct: 100 },
    ]);
  });
});
