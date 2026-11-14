import type { allExams } from "content-collections";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  examLabel,
  examOf,
  examRecord,
  firstOpenExam,
  maxPlaces,
} from "./exams";

type Exam = (typeof allExams)[number];

async function withExams(edit: (exam: Exam) => Exam[]) {
  vi.resetModules();
  vi.doMock("content-collections", async (importOriginal) => {
    const content =
      await importOriginal<typeof import("content-collections")>();
    const [exam] = content.allExams;
    return { ...content, allExams: exam ? edit(exam) : [] };
  });
  return import("./exams");
}

describe("firstOpenExam", () => {
  afterEach(() => {
    vi.doUnmock("content-collections");
  });

  it("gives the first open exam", () => {
    expect(firstOpenExam()).toBe("ftn-p1");
  });

  it("skips closed exams and takes the lowest order", async () => {
    const exams = await withExams((exam) => [
      { ...exam, id: "late", open: true, order: 3 },
      { ...exam, id: "closed", open: false, order: 0 },
      { ...exam, id: "early", open: true, order: 2 },
    ]);
    expect(exams.firstOpenExam()).toBe("early");
  });

  it("fails when no exam is open", async () => {
    const exams = await withExams((exam) => [{ ...exam, open: false }]);
    expect(() => exams.firstOpenExam()).toThrow("no exam is open");
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

describe("examLabel", () => {
  it("names an exam in the locale and falls back to its own name", () => {
    const exam = examRecord("ftn-p1");
    expect(examLabel(exam, "ru")).toBe(exam.label?.ru);
    expect(examLabel(exam, "sr-Latn")).toBe(exam.name);
  });
});
