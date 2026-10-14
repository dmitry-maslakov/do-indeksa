import { describe, expect, it } from "vitest";
import { segmentOf } from "./strip";

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
