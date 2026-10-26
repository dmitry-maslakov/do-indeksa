import { describe, expect, it } from "vitest";
import { belgradeDate, timeZoneSchema } from "./dates";

describe("belgradeDate", () => {
  it("uses the Belgrade calendar day", () => {
    expect(belgradeDate(new Date("2026-10-07T22:30:00Z"))).toBe("2026-10-08");
  });
});

describe("timeZoneSchema", () => {
  it("keeps a known time zone", () => {
    expect(timeZoneSchema.parse("Europe/Belgrade")).toBe("Europe/Belgrade");
  });

  it("drops a time zone it doesn't know", () => {
    expect(timeZoneSchema.parse("Mars/Olympus")).toBeUndefined();
  });
});
