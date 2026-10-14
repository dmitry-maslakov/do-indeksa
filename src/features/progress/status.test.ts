import { describe, expect, it } from "vitest";
import { statusSegment } from "./status";

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
