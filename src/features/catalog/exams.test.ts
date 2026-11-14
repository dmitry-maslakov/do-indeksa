import { describe, expect, it } from "vitest";
import { examOf, firstOpenExam, maxPlaces } from "./exams";

describe("firstOpenExam", () => {
  it("gives the first open exam", () => {
    expect(firstOpenExam()).toBe("ftn-p1");
  });
});

describe("examOf", () => {
  it("fails on an exam that does not exist", () => {
    expect(() => examOf("nema-ispita")).toThrow("nema-ispita");
  });

  it("lists the topics of the positions first and the others after", () => {
    const { positions, topics } = examOf("ftn-p1");
    expect(topics.slice(0, positions.length)).toEqual(
      positions.map((p) => p.topic),
    );
  });

  it("gives every position topic its number", () => {
    const { numberOf, positions } = examOf("ftn-p1");
    for (const p of positions) expect(numberOf(p.topic)).toBe(p.number);
  });

  it("has no number for a topic outside the exam", () => {
    const { numberOf } = examOf("ftn-p1");
    expect(numberOf("sequences")).toBeNull();
    expect(numberOf("")).toBeNull();
  });
});

describe("maxPlaces", () => {
  it("fits the largest exam", () => {
    expect(maxPlaces).toBeGreaterThanOrEqual(examOf("ftn-p1").positions.length);
  });
});
