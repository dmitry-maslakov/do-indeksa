import { describe, expect, it } from "vitest";
import { latestStatuses } from "./progress";

describe("latestStatuses", () => {
  it("keeps the newest attempt per task", () => {
    const statuses = latestStatuses([
      { taskId: "a", correct: false },
      { taskId: "b", correct: true },
      { taskId: "a", correct: true },
    ]);
    expect(Object.fromEntries(statuses)).toEqual({ a: "wrong", b: "solved" });
  });

  it("is empty without attempts", () => {
    expect(latestStatuses([]).size).toBe(0);
  });
});
