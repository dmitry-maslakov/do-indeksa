import { describe, expect, it } from "vitest";
import { dailySize } from "./exam";
import { belgradeDate, getVariant, officialVariants } from "./variants";

describe("getVariant", () => {
  it("finds a variant from the bank", () => {
    const official = officialVariants[0];
    expect(official && getVariant(official.id)).toBe(official);
  });

  it("builds the same daily test for the same day", () => {
    const daily = getVariant("daily-2026-10-08");
    expect(daily?.taskIds).toHaveLength(dailySize);
    expect(getVariant("daily-2026-10-08")?.taskIds).toEqual(daily?.taskIds);
  });

  it("orders a custom set by task number and rejects unknown tasks", () => {
    expect(getVariant("set-log-001.kb-003")?.taskIds).toEqual([
      "kb-003",
      "log-001",
    ]);
    expect(getVariant("set-log-001.missing")).toBeUndefined();
  });

  it("ignores unknown ids", () => {
    expect(getVariant("nope")).toBeUndefined();
  });
});

describe("belgradeDate", () => {
  it("uses the Belgrade calendar day", () => {
    expect(belgradeDate(new Date("2026-10-07T22:30:00Z"))).toBe("2026-10-08");
  });
});
