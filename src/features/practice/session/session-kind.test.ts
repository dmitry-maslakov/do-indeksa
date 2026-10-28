import { describe, expect, it } from "vitest";
import { practiceKind } from "./session-kind";

describe("practiceKind", () => {
  it("starts with the first attempt", () => {
    expect(practiceKind(undefined, false)).toBe("first");
  });

  it("keeps the first attempt within an hour of its last event", () => {
    expect(practiceKind({ kind: "first", recent: true }, true)).toBe("first");
  });

  it("opens a retry an hour after the last event", () => {
    expect(practiceKind({ kind: "first", recent: false }, true)).toBe("retry");
  });

  it("keeps the first attempt while nothing was answered or revealed", () => {
    expect(practiceKind({ kind: "first", recent: false }, false)).toBe("first");
  });

  it("counts practice right after an answered mock test as a retry", () => {
    expect(practiceKind({ kind: "mock", recent: true }, true)).toBe("retry");
  });
});
