import { describe, expect, it } from "vitest";
import { maxPlaces } from "@/features/catalog/exams";
import { tasks } from "@/features/catalog/tasks";
import { setId } from "./variant-id";
import { getVariant, officialVariants, slotsOf } from "./variants";

describe("getVariant", () => {
  it("finds a variant from the bank", () => {
    const official = officialVariants[0];
    expect(official && getVariant(official.id)).toBe(official);
  });

  it("orders a custom set by exam topic and rejects unknown tasks", () => {
    expect(getVariant("set-log-001.kb-003")?.taskIds).toEqual([
      "kb-003",
      "log-001",
    ]);
    expect(getVariant("set-log-001.missing")).toBeUndefined();
  });

  it("takes a set up to the exam size and no more", () => {
    expect(tasks.length).toBeGreaterThan(maxPlaces);
    const ids = tasks.slice(0, maxPlaces + 1).map((t) => t.id);
    expect(getVariant(setId(ids.slice(0, maxPlaces)))).toBeDefined();
    expect(getVariant(setId(ids))).toBeUndefined();
  });

  it("ignores unknown ids", () => {
    expect(getVariant("nope")).toBeUndefined();
  });
});

describe("slotsOf", () => {
  it("takes number, points and minutes from the place in the test", () => {
    expect(slotsOf(["log-001", "kb-003"])).toEqual([
      {
        taskId: "log-001",
        number: 1,
        topic: "logarithms",
        points: 6,
        minutes: 24,
      },
      {
        taskId: "kb-003",
        number: 2,
        topic: "complex-numbers",
        points: 6,
        minutes: 24,
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
    const slots = slotsOf(ids);
    expect(slots.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(slots.slice(0, 2).map((s) => s.topic)).toEqual([
      "quadratic-equations",
      "complex-numbers",
    ]);
    expect(slots.every((s) => s.points === 6 && s.minutes === 24)).toBe(true);
  });

  it("skips tasks that are not in the bank", () => {
    expect(
      slotsOf(["missing", "log-001"]).map((t) => [t.taskId, t.number]),
    ).toEqual([["log-001", 1]]);
  });
});
