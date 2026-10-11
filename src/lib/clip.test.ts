import { describe, expect, it } from "vitest";
import { clip } from "./clip";

describe("clip", () => {
  it("keeps text that fits", () => {
    expect(clip("Odrediti moduo.", 15)).toBe("Odrediti moduo.");
  });

  it("cuts long text at a word boundary", () => {
    const text = clip("reč ".repeat(60).trim(), 160);
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text).toMatch(/reč…$/);
  });

  it("cuts text without spaces at the length", () => {
    expect(clip("x".repeat(200), 10)).toBe(`${"x".repeat(9)}…`);
  });
});
