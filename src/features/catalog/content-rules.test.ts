import { describe, expect, it } from "vitest";
import {
  type ExamContext,
  type ExamRecord,
  examProblem,
  facultyProblem,
  variantProblem,
} from "./content-rules";

describe("facultyProblem", () => {
  const filled = { programs: 1, openExams: 1 };

  it("accepts a lower-case id", () => {
    expect(facultyProblem("etf", filled)).toBeUndefined();
  });

  it.each(["Etf", "e-tf"])("rejects %s", (id) => {
    expect(facultyProblem(id, filled)).toMatch(/lower-case/);
  });

  it.each(["ru", "api", "tasks", "training", "exams", "prep"])(
    "rejects the reserved %s",
    (id) => {
      expect(facultyProblem(id, filled)).toMatch(/reserved/);
    },
  );

  it("rejects a faculty without programmes", () => {
    expect(facultyProblem("etf", { ...filled, programs: 0 })).toMatch(
      /no programmes/,
    );
  });

  it("rejects content without an open exam", () => {
    expect(facultyProblem("etf", { ...filled, openExams: 0 })).toMatch(
      /no exam is open/,
    );
  });
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

const taskTopics = new Map([
  ["task-1", "algebra"],
  ["task-2", "geometry"],
]);

const context: ExamContext = {
  exams: [open, closed],
  links: ["rules"],
  years: [2025, 2026],
  topics: ["algebra"],
  topicOf: (task) => taskTopics.get(task),
};

describe("examProblem", () => {
  it.each([open, closed])("accepts $id", (exam) => {
    expect(examProblem(exam, context)).toBeUndefined();
  });

  it.each<[string, ExamRecord, RegExp]>([
    ["a reserved segment", { ...closed, segment: "about" }, /address/],
    ["a segment with a dash", { ...closed, segment: "m-2" }, /address/],
    ["a repeated title", { ...closed, title: "M1" }, /same title/],
    ["a repeated order", { ...closed, order: 1 }, /same title or order/],
    ["minutes beside tests", { ...open, minutes: 240 }, /takes its minutes/],
    ["a summary beside tests", { ...open, summary: "Opis" }, /no summary/],
    [
      "no tests and no summary",
      { ...closed, summary: undefined },
      /needs a summary/,
    ],
    [
      "an open exam without tests",
      { ...closed, open: true, label: {} },
      /without tests is closed/,
    ],
    [
      "an exam without tests with an about page",
      { ...closed, about: open.about },
      /without tests is closed/,
    ],
    [
      "an open exam without a label",
      { ...open, label: undefined },
      /needs a label/,
    ],
    [
      "an about page of a closed exam",
      { ...open, open: false, label: undefined },
      /only an open exam/,
    ],
    [
      "a link the faculty lacks",
      { ...open, about: { rulesSources: [{ link: "faq" }] } },
      /no link "faq"/,
    ],
    [
      "a year without admissions",
      { ...open, about: { rulesSources: [{ cycle: 2027 }] } },
      /no admissions for 2027/,
    ],
    [
      "a sample task of another topic",
      { ...open, sampleTask: "task-2" },
      /not a task of a topic/,
    ],
    [
      "a sample task that does not exist",
      { ...open, sampleTask: "nema" },
      /unknown task "nema"/,
    ],
  ])("rejects %s", (_, exam, message) => {
    expect(examProblem(exam, context)).toMatch(message);
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
    [{ kind: "curated", held: "2025-07-01" }, /only an official/],
    [{ kind: "official", year: 2024, held: "2025-07-01" }, /not in 2024/],
  ])("rejects %j", (variant, message) => {
    expect(variantProblem(variant)).toMatch(message);
  });
});
