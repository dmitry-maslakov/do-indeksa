import { describe, expect, it } from "vitest";
import { maxPlaces } from "@/features/catalog/exams";
import { tasks } from "@/features/catalog/tasks";
import { setId } from "./variant-id";
import {
  getVariant,
  isVariant,
  officialVariants,
  officialYears,
  slotsOf,
} from "./variants";

const exam = "ftn-p1";

describe("getVariant", () => {
  it("finds a variant from the bank", () => {
    const official = officialVariants[0];
    expect(official && getVariant(exam, official.id)).toBe(official);
  });

  it("orders a custom set by exam topic and rejects unknown tasks", () => {
    expect(getVariant(exam, "set-log-001.kb-003")?.taskIds).toEqual([
      "kb-003",
      "log-001",
    ]);
    expect(getVariant(exam, "set-log-001.missing")).toBeUndefined();
  });

  it("takes a set up to the exam size and no more", () => {
    expect(tasks.length).toBeGreaterThan(maxPlaces);
    const ids = tasks.slice(0, maxPlaces + 1).map((t) => t.id);
    expect(getVariant(exam, setId(ids.slice(0, maxPlaces)))).toBeDefined();
    expect(getVariant(exam, setId(ids))).toBeUndefined();
  });

  it("ignores unknown ids", () => {
    expect(getVariant(exam, "nope")).toBeUndefined();
  });
});

describe("isVariant", () => {
  it("knows bank variants and custom sets up to the exam size", () => {
    const ids = tasks.slice(0, maxPlaces + 1).map((t) => t.id);
    expect(isVariant(officialVariants[0]?.id ?? "")).toBe(true);
    expect(isVariant("set-log-001.kb-003")).toBe(true);
    expect(isVariant(setId(ids))).toBe(false);
    expect(isVariant("nope")).toBe(false);
  });
});

describe("slotsOf", () => {
  it("takes number, points and minutes from the place in the test", () => {
    expect(slotsOf(exam, ["log-001", "kb-003"])).toEqual([
      {
        taskId: "log-001",
        number: 1,
        topic: "logarithms",
        points: 6,
        minutes: 24,
        scoring: "proportional",
      },
      {
        taskId: "kb-003",
        number: 2,
        topic: "complex-numbers",
        points: 6,
        minutes: 24,
        scoring: "proportional",
      },
    ]);
  });

  it("numbers a whole test by place, whatever its topics", () => {
    const ids = [
      "kv-002",
      "kb-003",
      "eks-001",
      "log-001",
      "trig-001",
      "vek-002",
      "plan-001",
      "eks-002",
      "fun-002",
      "komb-002",
    ];
    const slots = slotsOf(exam, ids);
    expect(slots.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(slots.slice(0, 2).map((s) => s.topic)).toEqual([
      "quadratic-equations",
      "complex-numbers",
    ]);
    expect(slots.every((s) => s.points === 6 && s.minutes === 24)).toBe(true);
  });

  it("skips tasks that are not in the bank", () => {
    expect(
      slotsOf(exam, ["missing", "log-001"]).map((t) => [t.taskId, t.number]),
    ).toEqual([["log-001", 1]]);
  });
});

describe("officialYears", () => {
  it("spans the official papers of the exams and nothing for an exam without", () => {
    const years = officialVariants.flatMap((v) => v.year ?? []);
    const span = { first: Math.min(...years), last: Math.max(...years) };
    expect(officialYears(exam)).toEqual(span);
    expect(officialYears(exam, "ftn-p3")).toEqual(span);
    expect(officialYears("ftn-p3")).toBeUndefined();
    expect(officialYears()).toBeUndefined();
  });
});
