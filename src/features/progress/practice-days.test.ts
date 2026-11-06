import { describe, expect, it } from "vitest";
import { minuteMs } from "@/lib/dates";
import { mondayOf, regularity, streakOf } from "./practice-days";

const at = (day: string, hour = 12) =>
  Date.parse(`${day}T${String(hour).padStart(2, "0")}:00:00Z`);

const span = (day: string, minutes: number, hour = 12) => ({
  at: at(day, hour),
  tz: "UTC",
  ms: minutes * minuteMs,
});

describe("mondayOf", () => {
  it("finds the Monday of the week", () => {
    expect(mondayOf("2026-11-04")).toBe("2026-11-02");
    expect(mondayOf("2026-11-02")).toBe("2026-11-02");
    expect(mondayOf("2026-11-08")).toBe("2026-11-02");
  });
});

describe("regularity", () => {
  const spans = [
    span("2026-11-02", 30),
    span("2026-11-02", 5, 18),
    span("2026-11-04", 20),
    span("2026-11-03", 10),
    span("2026-10-28", 60),
  ];

  it("lays out whole weeks from Monday, this week last", () => {
    const { weeks } = regularity(spans, "2026-11-04", 2);
    expect(weeks.map((week) => week.map((d) => d.day))).toEqual([
      [
        "2026-10-26",
        "2026-10-27",
        "2026-10-28",
        "2026-10-29",
        "2026-10-30",
        "2026-10-31",
        "2026-11-01",
      ],
      [
        "2026-11-02",
        "2026-11-03",
        "2026-11-04",
        "2026-11-05",
        "2026-11-06",
        "2026-11-07",
        "2026-11-08",
      ],
    ]);
    expect(weeks[1]?.map((d) => d.ms / minuteMs)).toEqual([
      35, 10, 20, 0, 0, 0, 0,
    ]);
    expect(weeks[1]?.map((d) => d.future)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
  });

  it("counts the days and the time in the shown weeks only", () => {
    expect(regularity(spans, "2026-11-04", 2)).toMatchObject({
      days: 4,
      ms: 125 * minuteMs,
    });
    expect(regularity(spans, "2026-11-04", 1)).toMatchObject({
      days: 3,
      ms: 65 * minuteMs,
    });
  });

  it("puts a session on the day of its own time zone", () => {
    const late = { at: at("2026-11-03", 23), tz: "Europe/Belgrade", ms: 0 };
    expect(regularity([late], "2026-11-04", 1).weeks[0]?.[2]?.active).toBe(
      true,
    );
  });
});

describe("streakOf", () => {
  const days = new Set([
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-10-28",
  ]);

  it("counts the days in a row up to today", () => {
    expect(streakOf(days, "2026-11-04")).toBe(3);
  });

  it("keeps the streak from yesterday until today is practised", () => {
    expect(streakOf(days, "2026-11-05")).toBe(3);
    expect(streakOf(days, "2026-11-06")).toBe(0);
  });

  it("is not capped by any window", () => {
    const month = new Set(
      Array.from({ length: 40 }, (_, i) =>
        new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10),
      ),
    );
    expect(streakOf(month, "2026-11-09")).toBe(40);
  });
});
