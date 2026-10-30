import { describe, expect, it } from "vitest";
import { belgradeDate, dateIn } from "./dates";

describe("belgradeDate", () => {
  it("uses the Belgrade calendar day", () => {
    expect(belgradeDate(new Date("2026-10-07T22:30:00Z"))).toBe("2026-10-08");
  });
});

describe("dateIn", () => {
  it("uses the given time zone and falls back to Belgrade", () => {
    const at = Date.parse("2026-10-07T22:30:00Z");
    expect(dateIn(at, "America/New_York")).toBe("2026-10-07");
    expect(dateIn(at, null)).toBe("2026-10-08");
  });
});
