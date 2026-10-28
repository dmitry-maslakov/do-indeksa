import { describe, expect, it } from "vitest";
import { timeZoneSchema } from "./time-zone";

describe("timeZoneSchema", () => {
  it("keeps a known time zone", () => {
    expect(timeZoneSchema.parse("Europe/Belgrade")).toBe("Europe/Belgrade");
  });

  it("drops a time zone it doesn't know", () => {
    expect(timeZoneSchema.parse("Mars/Olympus")).toBeUndefined();
  });
});
