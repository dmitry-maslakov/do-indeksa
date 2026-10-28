import { describe, expect, it } from "vitest";
import { isReturningGuest } from "./nudge";

const today = "2026-10-28";
const yesterday = new Date("2026-10-27T12:00:00Z");
const now = new Date("2026-10-28T12:00:00Z");

describe("isReturningGuest", () => {
  it("needs five solved tasks", () => {
    expect(isReturningGuest(Array(4).fill(yesterday), today)).toBe(false);
    expect(isReturningGuest(Array(5).fill(yesterday), today)).toBe(true);
  });

  it("needs a task solved on an earlier day", () => {
    expect(isReturningGuest(Array(9).fill(now), today)).toBe(false);
    expect(isReturningGuest([yesterday, ...Array(4).fill(now)], today)).toBe(
      true,
    );
  });
});
