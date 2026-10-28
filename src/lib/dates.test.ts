import { describe, expect, it } from "vitest";
import { belgradeDate } from "./dates";

describe("belgradeDate", () => {
  it("uses the Belgrade calendar day", () => {
    expect(belgradeDate(new Date("2026-10-07T22:30:00Z"))).toBe("2026-10-08");
  });
});
