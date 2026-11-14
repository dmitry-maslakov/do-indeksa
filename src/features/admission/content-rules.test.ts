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

  it.each<[string, ProgramRecord, RegExp]>([
    ["a slug with capitals", { ...plain, slug: "Geo" }, /lower-case words/],
    [
      "a checked programme without an intro",
      { ...checked, content: " " },
      /needs the intro/,
    ],
    [
      "a checked programme without espb",
      { ...checked, espb: undefined },
      /needs espb/,
    ],
    [
      "a checked programme without a plan",
      { ...checked, plan: [] },
      /needs plan/,
    ],
    [
      "a checked programme without links.plan",
      { ...checked, links: {} },
      /needs links\.plan/,
    ],
    [
      "a plan item with subjects and text",
      {
        ...checked,
        plan: [{ years: [1, 2, 3, 4], subjects: ["A"], text: "B" }],
      },
      /either subjects or text/,
    ],
    [
      "a plan that skips a year",
      { ...checked, plan: [{ years: [1, 2, 4], text: "A" }] },
      /covers years 1 to 4/,
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
      /covers years 1 to 4/,
    ],
    [
      "modules without modulesFrom",
      { ...checked, modulesFrom: undefined },
      /come together/,
    ],
    [
      "modulesFrom without modules",
      { ...plain, modulesFrom: 2 },
      /come together/,
    ],
    [
      "modulesFrom in the first year",
      { ...checked, modulesFrom: 1 },
      /between 2 and 4/,
    ],
    [
      "two modules with one id",
      { ...checked, modules: [{ name: "Modul A" }, { name: "modul a" }] },
      /two modules/,
    ],
    [
      "a module named like an anchor",
      { ...checked, modules: [{ name: "Upis" }] },
      /cannot be a module id/,
    ],
    [
      "a repeated name",
      { ...plain, name: "Računarstvo" },
      /another programme is named/,
    ],
    [
      "an alias of another programme",
      { ...plain, aliases: ["RA"] },
      /names another programme/,
    ],
    [
      "a short equal to its alias",
      { ...checked, short: "RA" },
      /names another programme/,
    ],
    [
      "applied studies of 4 years",
      { ...plain, years: 4 },
      /do not last 4 years/,
    ],
    [
      "academic studies of 3 years",
      { ...plain, level: "academic" },
      /do not last 3 years/,
    ],
    [
      "joint departments without a home",
      { ...plain, jointDepartments: 2 },
      /home department/,
    ],
  ])("rejects %s", (_, program, message) => {
    expect(programProblem(program, siblings, true)).toMatch(message);
  });

  it("rejects a checked programme of a closed exam", () => {
    expect(programProblem(checked, siblings, false)).toMatch(/open exam/);
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

  it.each<[string, AdmissionRecord, RegExp]>([
    [
      "an unknown programme",
      row({ nema: { cutoff: older.programs.ra?.cutoff } }),
      /unknown programme/,
    ],
    [
      "budget without self",
      row({ ra: { budget: 1, cutoff: { budget: null, self: null } } }),
      /come together/,
    ],
    ["a row with nothing", row({ ra: {} }), /places or cutoffs/],
    [
      "places without cutoffs beside statistics",
      row({ ra: { budget: 1, self: 1 } }),
      /exactly when/,
    ],
    [
      "cutoffs without statistics",
      { ...older, statistics: undefined },
      /exactly when/,
    ],
    [
      "a cutoff above the total",
      row({ ra: { cutoff: { budget: 101, self: null } } }),
      /above the total/,
    ],
    [
      "a cutoff at an over threshold",
      row({ ra: { cutoff: { budget: 50, self: null } } }),
      /does not meet/,
    ],
    [
      "a cutoff below an atLeast threshold",
      row({ ra: { cutoff: { budget: null, self: 29.99 } } }),
      /does not meet/,
    ],
    [
      "school points with min above max",
      { ...older, scoring: { ...older.scoring, school: { min: 50, max: 40 } } },
      /min above max/,
    ],
    [
      "a threshold above the total",
      { ...older, thresholds: { ...older.thresholds, examMin: 120 } },
      /above 100/,
    ],
    [
      "wishes of an unknown exam",
      { ...older, wishes: { also: { "uni-m9": [] } } },
      /not an exam of the faculty/,
    ],
    [
      "an exam that lists itself",
      { ...older, wishes: { also: { "uni-m1": ["uni-m1"] } } },
      /lists itself/,
    ],
    [
      "a date of an unknown exam",
      { ...older, schedule: { exams: { "uni-m9": [{}] } } },
      /not an exam of the faculty/,
    ],
  ])("rejects %s", (_, admission, message) => {
    expect(admissionProblem(admission, admissionContext)).toMatch(message);
  });

  it.each<[string, AdmissionRecord, AdmissionContext, RegExp]>([
    [
      "no tieBreak",
      { ...newest, tieBreak: undefined },
      latest,
      /needs tieBreak/,
    ],
    ["no fees", { ...newest, fees: undefined }, latest, /needs fees/],
    [
      "a programme without tuition",
      {
        ...newest,
        programs: { ...newest.programs, ra: { budget: 1, self: 1 } },
      },
      latest,
      /places and tuition of ra/,
    ],
    [
      "an exam without a date",
      { ...newest, schedule: { exams: { "uni-m1": [{}] } } },
      latest,
      /date of uni-m2/,
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
      /50 points, not 60/,
    ],
  ])("rejects a newest year with %s", (_, admission, context, message) => {
    expect(admissionProblem(admission, context)).toMatch(message);
  });
});
