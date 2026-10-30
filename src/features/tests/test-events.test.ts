import { describe, expect, it } from "vitest";
import { testFinished } from "./test-events";

const testSessionId = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const facts = {
  test_session_id: testSessionId,
  variant_id: "ftn-p1-2025",
  variant_kind: "official",
  tasks: 10,
  minutes: 240,
};

describe("test events", () => {
  it("accepts a finished test and rejects a negative score", () => {
    const finished = {
      ...facts,
      weekly: false,
      answered: 1,
      correct: 0,
      score: 0,
      max_points: 60,
      elapsed_ms: 900_000,
      overtime: false,
      unanswered: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      visits: 3,
      positions_visited: 2,
    };
    expect(testFinished.props.safeParse(finished).success).toBe(true);
    expect(
      testFinished.props.safeParse({ ...finished, score: -1 }).success,
    ).toBe(false);
  });

  it("never uses OpenPanel's reserved keys", () => {
    const keys = Object.keys(testFinished.props.shape);
    expect(keys.filter((key) => key.startsWith("__"))).toEqual([]);
  });
});
