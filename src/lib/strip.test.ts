import { describe, expect, it } from "vitest";
import { segmentOf, statusSegment } from "./strip";

describe("segmentOf", () => {
  it.each([
    [undefined, "none"],
    [[], "none"],
    [[true, true], "done"],
    [[false], "error"],
    [[true, false], "partial"],
  ] as const)("maps %j to %s", (parts, segment) => {
    expect(segmentOf(parts ? [...parts] : undefined)).toBe(segment);
  });
});

describe("statusSegment", () => {
  it.each([
    [undefined, "none"],
    ["new", "none"],
    ["solved", "done"],
    ["wrong", "error"],
  ] as const)("maps %s to %s", (status, segment) => {
    expect(statusSegment(status)).toBe(segment);
  });
});
