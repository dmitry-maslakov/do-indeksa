import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import type { TaskStat } from "./stats";
import { suggest, type TopicProgress, topicProgress } from "./topic-progress";

const now = 100 * dayMs;

const stat = (topic: string, latestRight: boolean, lastAt = now): TaskStat => ({
  taskId: `${topic}-${lastAt}-${latestRight}`,
  number: null,
  topic,
  attempts: 1,
  right: latestRight ? 1 : 0,
  recentAttempts: 1,
  recentRight: latestRight ? 1 : 0,
  durationMs: 0,
  firstRight: latestRight,
  latestRight,
  lastAt,
});

const topic = (
  name: string,
  pct: number,
  lastAt: number | null = null,
): TopicProgress => ({
  topic: name,
  pct,
  lastAt,
  state: "inProgress",
});

describe("topicProgress", () => {
  const totals = [
    { topic: "a", total: 4 },
    { topic: "b", total: 2 },
    { topic: "c", total: 10 },
  ];

  it("derives percent solved and state per topic", () => {
    const rows = topicProgress(
      [
        stat("a", true),
        stat("a", true, now - 1),
        stat("a", true, now - 2),
        stat("b", false, now - 8 * dayMs),
      ],
      totals,
      now,
    );
    expect(rows).toEqual([
      { topic: "a", pct: 75, lastAt: now, state: "mastered" },
      { topic: "b", pct: 0, lastAt: now - 8 * dayMs, state: "review" },
      { topic: "c", pct: 0, lastAt: null, state: "notStarted" },
    ]);
  });

  it("keeps recent mistakes in progress", () => {
    const [row] = topicProgress([stat("a", false)], totals, now);
    expect(row?.state).toBe("inProgress");
  });
});

describe("suggest", () => {
  it("starts with the first topic on a first visit", () => {
    expect(suggest([topic("a", 0), topic("b", 0)], [])).toEqual({
      topic: "a",
      reason: "first",
    });
  });

  it("returns to the last topic after two recent mistakes", () => {
    expect(
      suggest([topic("a", 80, 1), topic("b", 10, 2)], [false, true, false]),
    ).toEqual({ topic: "b", reason: "stuck" });
  });

  it("moves on to the next unfinished topic", () => {
    expect(
      suggest(
        [topic("a", 10), topic("b", 75, 5), topic("c", 90), topic("d", 0)],
        [true],
      ),
    ).toEqual({ topic: "d", reason: "next" });
  });

  it("tells how close the last topic is", () => {
    expect(suggest([topic("a", 60, 1)], [true])?.reason).toBe("almost");
    expect(suggest([topic("a", 20, 1)], [true])?.reason).toBe("started");
    expect(suggest([topic("a", 20, 1)], [false, true])?.reason).toBe("started");
  });

  it("keeps the last topic once every topic is mastered", () => {
    expect(suggest([topic("a", 80, 1), topic("b", 90)], [true])).toEqual({
      topic: "a",
      reason: "done",
    });
  });
});
