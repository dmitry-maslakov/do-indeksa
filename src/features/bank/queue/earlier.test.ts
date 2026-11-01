import { describe, expect, it } from "vitest";
import type { Outcome, Result, Touch } from "@/features/progress/status";
import { hourMs, minuteMs } from "@/lib/dates";
import { earlierCount, earlierGroups, periodOf } from "./earlier";

const now = Date.parse("2026-10-28T12:00:00Z");

const ago = (hours: number) => now - hours * hourMs;

const touch = (taskId: string, hours: number): Touch => ({
  taskId,
  kind: "first",
  from: ago(hours),
  to: ago(hours) + 5 * minuteMs,
});

const outcome = (taskId: string, hours: number, result: Result): Outcome => ({
  taskId,
  at: ago(hours) + minuteMs,
  result,
});

const shown = (touches: Touch[], outcomes: Outcome[]) =>
  earlierGroups(touches, outcomes, now, null).map((g) => ({
    kind: g.period.kind,
    tasks: g.tasks.map((t) => `${t.id} ${t.result}`),
  }));

describe("periodOf", () => {
  it("names a session of today and yesterday by when it started", () => {
    expect(periodOf(ago(3), now)).toEqual({ kind: "today", at: ago(3) });
    expect(periodOf(ago(20), now)).toEqual({ kind: "yesterday", at: ago(20) });
  });

  it("names a day of the last week by its date", () => {
    expect(periodOf(ago(40), now)).toEqual({ kind: "day", day: "2026-10-26" });
    expect(periodOf(ago(6 * 24), now)).toEqual({
      kind: "day",
      day: "2026-10-22",
    });
  });

  it("names an older week from its Monday to its Sunday", () => {
    expect(periodOf(Date.parse("2026-10-14T10:00:00Z"), now)).toEqual({
      kind: "week",
      from: "2026-10-12",
      to: "2026-10-18",
    });
  });

  it("ends the latest week where the days begin", () => {
    expect(periodOf(ago(7 * 24), now)).toEqual({
      kind: "week",
      from: "2026-10-19",
      to: "2026-10-21",
    });
  });

  it("counts days in the student's time zone", () => {
    const late = Date.parse("2026-10-27T23:30:00Z");
    expect(periodOf(late, now).kind).toBe("today");
    expect(periodOf(late, now, "America/New_York").kind).toBe("yesterday");
  });
});

describe("earlierGroups", () => {
  it("leaves out the current session", () => {
    const touches = [touch("a", 10), touch("b", 1)];
    const outcomes = [outcome("a", 10, "solved"), outcome("b", 1, "wrong")];
    expect(shown(touches, outcomes)).toEqual([
      { kind: "today", tasks: ["a solved"] },
    ]);
  });

  it("keeps the last session once it is four hours old", () => {
    const touches = [touch("a", 7), touch("b", 5)];
    const outcomes = [outcome("a", 7, "solved"), outcome("b", 5, "wrong")];
    expect(shown(touches, outcomes)).toEqual([
      { kind: "today", tasks: ["a solved", "b wrong"] },
    ]);
  });

  it("splits today and yesterday by session and older days by day", () => {
    const touches = [
      touch("a", 60),
      touch("b", 52),
      touch("c", 22),
      touch("d", 10),
      touch("e", 1),
    ];
    const outcomes = touches.map((t) =>
      outcome(t.taskId, (now - t.from) / hourMs, "solved"),
    );
    expect(shown(touches, outcomes)).toEqual([
      { kind: "day", tasks: ["a solved", "b solved"] },
      { kind: "yesterday", tasks: ["c solved"] },
      { kind: "today", tasks: ["d solved"] },
    ]);
  });

  it("lists only tasks with a result", () => {
    const touches = [touch("skipped", 30), touch("a", 29), touch("seen", 28)];
    const outcomes = [outcome("a", 29, "revealed")];
    expect(shown(touches, outcomes)).toEqual([
      { kind: "yesterday", tasks: ["a revealed"] },
    ]);
    expect(shown([touch("opened", 30)], [])).toEqual([]);
  });

  it("gives a task solved on several days that day's result", () => {
    const touches = [touch("a", 200), touch("a", 50), touch("a", 10)];
    const outcomes = [
      outcome("a", 200, "wrong"),
      outcome("a", 50, "revealed"),
      outcome("a", 10, "solved"),
    ];
    expect(shown(touches, outcomes)).toEqual([
      { kind: "week", tasks: ["a wrong"] },
      { kind: "day", tasks: ["a revealed"] },
      { kind: "today", tasks: ["a solved"] },
    ]);
  });

  it("takes the last answer of a session over an opened answer", () => {
    const touches = [touch("a", 10), touch("b", 9)];
    const outcomes = [
      outcome("a", 10, "wrong"),
      outcome("a", 10, "revealed"),
      outcome("b", 9, "wrong"),
      outcome("b", 9, "solved"),
    ];
    expect(shown(touches, outcomes)).toEqual([
      { kind: "today", tasks: ["a wrong", "b solved"] },
    ]);
  });

  it("orders the tasks of a group by their first touch", () => {
    const touches = [touch("b", 10), touch("a", 9), touch("b", 8)];
    const outcomes = [outcome("a", 9, "solved"), outcome("b", 8, "wrong")];
    expect(shown(touches, outcomes)).toEqual([
      { kind: "today", tasks: ["b wrong", "a solved"] },
    ]);
  });

  it("ignores touches in test sessions", () => {
    const touches: Touch[] = [{ ...touch("a", 10), kind: "mock" }];
    expect(shown(touches, [outcome("a", 10, "solved")])).toEqual([]);
  });

  it("counts every row of every group", () => {
    const touches = [touch("a", 50), touch("b", 49), touch("a", 10)];
    const outcomes = [
      outcome("a", 50, "solved"),
      outcome("b", 49, "wrong"),
      outcome("a", 10, "solved"),
    ];
    expect(earlierCount(earlierGroups(touches, outcomes, now, null))).toBe(3);
    expect(earlierCount([])).toBe(0);
  });
});
