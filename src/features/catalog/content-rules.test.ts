import { describe, expect, it } from "vitest";
import {
  type ExamContext,
  type ExamRecord,
  examProblem,
  facultyProblem,
  variantProblem,
} from "./content-rules";

describe("facultyProblem", () => {
  it("accepts a lower-case id", () => {
    expect(facultyProblem("etf")).toBeUndefined();
  });

  it.each(["Etf", "e-tf", "ru", "api", "tasks", "training", "exams", "prep"])(
    "rejects %s",
    (id) => {
      expect(facultyProblem(id)).toBeDefined();
    },
  );
});

const open: ExamRecord = {
  id: "uni-m1",
  faculty: "uni",
  segment: "m1",
  title: "M1",
  order: 1,
  tests: ["uni-math"],
  open: true,
  label: { ru: "Математика", en: "Mathematics" },
  sampleTask: "task-1",
  about: {
    rulesSources: [{ link: "rules" }],
    exemption: { sources: [{ cycle: 2026 }] },
  },
};

const closed: ExamRecord = {
  id: "uni-m2",
  faculty: "uni",
  segment: "m2",
  title: "M2",
  order: 2,
  tests: [],
  open: false,
  summary: "Opis",
};

const context: ExamContext = {
  exams: [open, closed],
  links: ["rules"],
  years: [2025, 2026],
  topics: ["algebra"],
  topicOf: (task) => (task === "task-1" ? "algebra" : "geometry"),
};

describe("examProblem", () => {
  it.each([open, closed])("accepts $id", (exam) => {
    expect(examProblem(exam, context)).toBeUndefined();
  });

  it.each<[string, ExamRecord]>([
    ["a reserved segment", { ...closed, segment: "about" }],
    ["a segment with a dash", { ...closed, segment: "m-2" }],
    ["a repeated title", { ...closed, title: "M1" }],
    ["a repeated order", { ...closed, order: 1 }],
    ["minutes beside tests", { ...open, minutes: 240 }],
    ["a summary beside tests", { ...open, summary: "Opis" }],
    ["no tests and no summary", { ...closed, summary: undefined }],
    ["an open exam without tests", { ...closed, open: true, label: {} }],
    ["an open exam without a label", { ...open, label: undefined }],
    ["an about page of a closed exam", { ...closed, about: open.about }],
    [
      "a link the faculty lacks",
      { ...open, about: { rulesSources: [{ link: "faq" }] } },
    ],
    [
      "a year without admissions",
      { ...open, about: { rulesSources: [{ cycle: 2027 }] } },
    ],
    ["a sample task of another topic", { ...open, sampleTask: "task-2" }],
    ["a sample task that does not exist", { ...open, sampleTask: "nema" }],
  ])("rejects %s", (_, exam) => {
    expect(examProblem(exam, context)).toBeDefined();
  });
});

describe("variantProblem", () => {
  it.each([
    { kind: "official", year: 2025, held: "2025-07-01" },
    { kind: "curated" },
  ])("accepts %j", (variant) => {
    expect(variantProblem(variant)).toBeUndefined();
  });

  it.each([
    { kind: "curated", held: "2025-07-01" },
    { kind: "official", year: 2024, held: "2025-07-01" },
  ])("rejects %j", (variant) => {
    expect(variantProblem(variant)).toBeDefined();
  });
});
