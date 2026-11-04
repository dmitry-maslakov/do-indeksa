import { describe, expect, it } from "vitest";
import { minuteMs } from "@/lib/dates";
import { mondayOf, regularity } from "./practice-days";

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

  it("lays out this week from Monday", () => {
    const { week, weekDays, weekMs } = regularity(spans, "2026-11-04", 8);
    expect(week.map((d) => d.day)).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
    expect(week.map((d) => d.ms / minuteMs)).toEqual([35, 10, 20, 0, 0, 0, 0]);
    expect(week.map((d) => d.future)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
    expect(weekDays).toBe(3);
    expect(weekMs).toBe(65 * minuteMs);
  });

  it("counts the days in a row up to today", () => {
    expect(regularity(spans, "2026-11-04", 8).streak).toBe(3);
  });

  it("keeps the streak from yesterday until today is practised", () => {
    expect(regularity(spans, "2026-11-05", 8).streak).toBe(3);
    expect(regularity(spans, "2026-11-06", 8).streak).toBe(0);
  });

  it("sums the minutes of each week, oldest first", () => {
    const { weeks } = regularity(spans, "2026-11-04", 3);
    expect(weeks).toEqual([
      { start: "2026-10-19", ms: 0 },
      { start: "2026-10-26", ms: 60 * minuteMs },
      { start: "2026-11-02", ms: 65 * minuteMs },
    ]);
  });

  it("puts a session on the day of its own time zone", () => {
    const late = { at: at("2026-11-03", 23), tz: "Europe/Belgrade", ms: 0 };
    expect(regularity([late], "2026-11-04", 1).week[2]?.active).toBe(true);
  });
});
