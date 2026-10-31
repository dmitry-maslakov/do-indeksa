import { describe, expect, it } from "vitest";
import { hourMs } from "@/lib/dates";
import { failStreak, idleMs, lastActivityAt, tasksToday } from "./rhythm";
import { obs } from "./status/observations.fixture";
import type { TaskActivity } from "./types";

const now = Date.parse("2026-10-20T21:30:00Z");

const activity = (
  taskId: string,
  hoursAgo: number,
  tz: string | null = "Europe/Belgrade",
): TaskActivity => ({
  taskId,
  topic: "logarithms",
  tz,
  at: now - hoursAgo * hourMs,
});

describe("tasksToday", () => {
  it("counts tasks with an attempt today, each once", () => {
    expect(
      tasksToday(
        [
          activity("a", 1),
          activity("a", 2, "America/New_York"),
          activity("b", 3),
          activity("c", 30),
        ],
        now,
      ),
    ).toBe(2);
  });

  it("takes the day in the session's time zone", () => {
    expect(tasksToday([activity("a", 1, "America/New_York")], now)).toBe(1);
    expect(tasksToday([activity("a", 22, "America/New_York")], now)).toBe(0);
  });

  it("falls back to Belgrade", () => {
    expect(tasksToday([activity("a", 22, null)], now)).toBe(1);
    expect(tasksToday([activity("a", 24, null)], now)).toBe(0);
  });
});

describe("lastActivityAt", () => {
  it("takes the latest attempt", () => {
    expect(lastActivityAt([activity("a", 3), activity("b", 1)])).toBe(
      now - hourMs,
    );
    expect(lastActivityAt([])).toBeNull();
  });
});

describe("failStreak", () => {
  it("counts the fails at the end, in time order", () => {
    const results = [
      obs("fail", { hours: 0 }),
      obs("clean", { hours: 1 }),
      obs("fail", { hours: 3 }),
      obs("fail", { hours: 2 }),
    ];
    expect(failStreak(results)).toBe(2);
  });

  it("is zero after a solved task and without observations", () => {
    expect(
      failStreak([obs("fail", { hours: 0 }), obs("helped", { hours: 1 })]),
    ).toBe(0);
    expect(failStreak([])).toBe(0);
  });

  it("counts every fail when there is nothing else", () => {
    expect(failStreak([0, 1, 2].map((hours) => obs("fail", { hours })))).toBe(
      3,
    );
  });
});

describe("idleMs", () => {
  it("measures the time since the last activity", () => {
    expect(idleMs(now - hourMs, now)).toBe(hourMs);
    expect(idleMs(null, now)).toBeNull();
  });
});
