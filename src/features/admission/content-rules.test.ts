import { describe, expect, it } from "vitest";
import {
  type AdmissionContext,
  type AdmissionRecord,
  admissionProblem,
  moduleIdsOf,
  type ProgramRecord,
  programProblem,
} from "./content-rules";

const checked: ProgramRecord = {
  slug: "ra",
  content: "Opis.",
  name: "Računarstvo",
  aliases: ["RA"],
  level: "academic",
  years: 4,
  espb: 240,
  links: { plan: {} },
  checked: "2026-01-01",
  degree: {},
  department: "Departman",
  plan: [
    { years: [1, 2], subjects: ["Algebra"] },
    { years: [3, 4], text: "Opis." },
  ],
  choice: "Opis.",
  modulesFrom: 3,
  modules: [{ name: "Modul A" }, { name: "Modul B" }],
};

const plain: ProgramRecord = {
  slug: "geodezija",
  content: "",
  name: "Geodezija",
  aliases: [],
  level: "applied",
  years: 3,
  links: {},
  plan: [],
  modules: [],
};

describe("moduleIdsOf", () => {
  it("slugs the module names", () => {
    expect(moduleIdsOf([{ name: "Računarski sistemi" }])).toEqual([
      "racunarski-sistemi",
    ]);
  });
});

describe("programProblem", () => {
  const siblings = [checked, plain];

  it.each([checked, plain])("accepts $slug", (program) => {
    expect(programProblem(program, siblings, true)).toBeUndefined();
  });

  it.each<[string, ProgramRecord]>([
    ["a slug with capitals", { ...plain, slug: "Geo" }],
    ["a checked programme without an intro", { ...checked, content: " " }],
    ["a checked programme without espb", { ...checked, espb: undefined }],
    ["a checked programme without a plan", { ...checked, plan: [] }],
    ["a checked programme without links.plan", { ...checked, links: {} }],
    [
      "a plan item with subjects and text",
      {
        ...checked,
        plan: [{ years: [1, 2, 3, 4], subjects: ["A"], text: "B" }],
      },
    ],
    [
      "a plan that skips a year",
      { ...checked, plan: [{ years: [1, 2, 4], text: "A" }] },
    ],
    [
      "a plan out of order",
      {
        ...checked,
        plan: [
          { years: [3, 4], text: "A" },
          { years: [1, 2], text: "B" },
        ],
      },
    ],
    ["modules without modulesFrom", { ...checked, modulesFrom: undefined }],
    ["modulesFrom without modules", { ...plain, modulesFrom: 2 }],
    ["modulesFrom in the first year", { ...checked, modulesFrom: 1 }],
    [
      "two modules with one id",
      { ...checked, modules: [{ name: "Modul A" }, { name: "modul a" }] },
    ],
    [
      "a module named like an anchor",
      { ...checked, modules: [{ name: "Upis" }] },
    ],
    ["a repeated name", { ...plain, name: "Računarstvo" }],
    ["an alias of another programme", { ...plain, aliases: ["RA"] }],
    ["a short equal to its alias", { ...checked, short: "RA" }],
    ["applied studies of 4 years", { ...plain, years: 4 }],
    ["academic studies of 3 years", { ...plain, level: "academic" }],
    ["joint departments without a home", { ...plain, jointDepartments: 2 }],
  ])("rejects %s", (_, program) => {
    expect(programProblem(program, siblings, true)).toBeDefined();
  });

  it("rejects a checked programme of a closed exam", () => {
    expect(programProblem(checked, siblings, false)).toBeDefined();
  });
});

const older: AdmissionRecord = {
  statistics: "https://example.com/",
  scoring: { school: { min: 20, max: 40 }, exam: { min: 0, max: 60 } },
  thresholds: { budget: { over: 50 }, self: { atLeast: 30 } },
  programs: {
    ra: { budget: 10, self: 5, cutoff: { budget: 70, self: null } },
    geodezija: { cutoff: { budget: null, self: 30 } },
  },
};

const newest: AdmissionRecord = {
  scoring: older.scoring,
  thresholds: older.thresholds,
  tieBreak: "exam",
  wishes: { also: { "uni-m1": ["uni-m2"], "uni-m2": [] } },
  schedule: { exams: { "uni-m1": [{}], "uni-m2": [{}] } },
  fees: {},
  programs: {
    ra: { budget: 10, self: 5, tuition: 1000 },
    geodezija: { budget: 0, self: 5, tuition: 1000 },
  },
};

const admissionContext: AdmissionContext = {
  newest: false,
  programs: ["ra", "geodezija"],
  exams: [
    { id: "uni-m1", points: 60, tests: ["uni-math"] },
    { id: "uni-m2", points: 60, tests: [] },
  ],
};

const latest = { ...admissionContext, newest: true };

describe("admissionProblem", () => {
  it("accepts an older year", () => {
    expect(admissionProblem(older, admissionContext)).toBeUndefined();
  });

  it("accepts the newest year", () => {
    expect(admissionProblem(newest, latest)).toBeUndefined();
  });

  const row = (programs: AdmissionRecord["programs"]) => ({
    ...older,
    programs,
  });

  it.each<[string, AdmissionRecord]>([
    [
      "an unknown programme",
      row({ nema: { cutoff: older.programs.ra?.cutoff } }),
    ],
    [
      "budget without self",
      row({ ra: { budget: 1, cutoff: { budget: null, self: null } } }),
    ],
    ["a row with nothing", row({ ra: {} })],
    [
      "places without cutoffs beside statistics",
      row({ ra: { budget: 1, self: 1 } }),
    ],
    ["cutoffs without statistics", { ...older, statistics: undefined }],
    [
      "a cutoff above the total",
      row({ ra: { cutoff: { budget: 101, self: null } } }),
    ],
    [
      "a cutoff at an over threshold",
      row({ ra: { cutoff: { budget: 50, self: null } } }),
    ],
    [
      "a cutoff below an atLeast threshold",
      row({ ra: { cutoff: { budget: null, self: 29.99 } } }),
    ],
    [
      "school points with min above max",
      { ...older, scoring: { ...older.scoring, school: { min: 50, max: 40 } } },
    ],
    [
      "a threshold above the total",
      { ...older, thresholds: { ...older.thresholds, examMin: 120 } },
    ],
    [
      "wishes of an unknown exam",
      { ...older, wishes: { also: { "uni-m9": [] } } },
    ],
    [
      "an exam that lists itself",
      { ...older, wishes: { also: { "uni-m1": ["uni-m1"] } } },
    ],
    [
      "a date of an unknown exam",
      { ...older, schedule: { exams: { "uni-m9": [{}] } } },
    ],
  ])("rejects %s", (_, admission) => {
    expect(admissionProblem(admission, admissionContext)).toBeDefined();
  });

  it.each<[string, AdmissionRecord, AdmissionContext]>([
    ["no tieBreak", { ...newest, tieBreak: undefined }, latest],
    ["no fees", { ...newest, fees: undefined }, latest],
    [
      "a programme without tuition",
      {
        ...newest,
        programs: { ...newest.programs, ra: { budget: 1, self: 1 } },
      },
      latest,
    ],
    [
      "an exam without a date",
      { ...newest, schedule: { exams: { "uni-m1": [{}] } } },
      latest,
    ],
    [
      "exam points other than the scoring",
      newest,
      {
        ...latest,
        exams: [
          { id: "uni-m1", points: 50, tests: ["uni-math"] },
          { id: "uni-m2", points: 60, tests: [] },
        ],
      },
    ],
  ])("rejects a newest year with %s", (_, admission, context) => {
    expect(admissionProblem(admission, context)).toBeDefined();
  });
});
