import { describe, expect, it } from "vitest";
import { examOf, maxPlaces } from "./exams";

describe("examOf", () => {
  it("gives the default exam without an id", () => {
    expect(examOf().id).toBe("ftn-p1");
  });

  it("fails on an exam that does not exist", () => {
    expect(() => examOf("nema-ispita")).toThrow("nema-ispita");
  });

  it("lists the topics of the positions first and the others after", () => {
    const { positions, topics } = examOf();
    expect(topics.slice(0, positions.length)).toEqual(
      positions.map((p) => p.topic),
    );
  });

  it("gives every position topic its number", () => {
    const { numberOf, positions } = examOf();
    for (const p of positions) expect(numberOf(p.topic)).toBe(p.number);
  });

  it("has no number for a topic outside the exam", () => {
    const { numberOf } = examOf();
    expect(numberOf("sequences")).toBeNull();
    expect(numberOf("")).toBeNull();
  });
});

describe("maxPlaces", () => {
  it("fits the largest exam", () => {
    expect(maxPlaces).toBeGreaterThanOrEqual(examOf().positions.length);
  });
});
