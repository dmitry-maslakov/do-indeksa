import { describe, expect, it } from "vitest";
import { numberOf, positions } from "./exams";

describe("numberOf", () => {
  it("gives every position topic its number", () => {
    for (const p of positions) expect(numberOf(p.topic)).toBe(p.number);
  });

  it("has no number for a topic outside the exam", () => {
    expect(numberOf("sequences")).toBeNull();
    expect(numberOf("")).toBeNull();
  });
});
