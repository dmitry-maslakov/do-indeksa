import { describe, expect, it } from "vitest";
import { getVariant, officialVariants, slotsOf } from "./variants";

describe("getVariant", () => {
  it("finds a variant from the bank", () => {
    const official = officialVariants[0];
    expect(official && getVariant(official.id)).toBe(official);
  });

  it("orders a custom set by task number and rejects unknown tasks", () => {
    expect(getVariant("set-log-001.kb-003")?.taskIds).toEqual([
      "kb-003",
      "log-001",
    ]);
    expect(getVariant("set-log-001.missing")).toBeUndefined();
  });

  it("ignores unknown ids", () => {
    expect(getVariant("nope")).toBeUndefined();
  });
});

describe("slotsOf", () => {
  it("takes number, points and minutes from the exam positions", () => {
    expect(slotsOf(["log-001", "kb-003"])).toEqual([
      {
        taskId: "log-001",
        number: 3,
        topic: "logarithms",
        points: 6,
        minutes: 24,
      },
      {
        taskId: "kb-003",
        number: 1,
        topic: "complex-numbers",
        points: 6,
        minutes: 24,
      },
    ]);
  });

  it("skips tasks that are not in the bank", () => {
    expect(slotsOf(["missing", "log-001"]).map((t) => t.taskId)).toEqual([
      "log-001",
    ]);
  });
});
