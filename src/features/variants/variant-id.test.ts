import { describe, expect, it } from "vitest";
import { customTaskIds, parseVariantId, setId } from "./variant-id";

describe("parseVariantId", () => {
  it.each([
    ["set-kb-001.log-002", { kind: "custom", taskIds: ["kb-001", "log-002"] }],
    ["set-kb-001.kb-001", { kind: "custom", taskIds: ["kb-001"] }],
  ])("reads %s", (id, parsed) => {
    expect(parseVariantId(id)).toEqual(parsed);
  });

  it.each(["daily-2026-10-08", "random-0a1b2c3d", "set-", "ftn-p1-2025"])(
    "ignores %s",
    (id) => {
      expect(parseVariantId(id)).toBeUndefined();
    },
  );

  it("round-trips a set", () => {
    expect(parseVariantId(setId(["a-1", "b-2"]))).toEqual({
      kind: "custom",
      taskIds: ["a-1", "b-2"],
    });
  });
});

describe("customTaskIds", () => {
  const exists = (id: string) => id !== "gone-1";

  it("returns the tasks of a set whose tasks all exist", () => {
    expect(customTaskIds("set-kb-001.log-002", 10, exists)).toEqual([
      "kb-001",
      "log-002",
    ]);
  });

  it("is undefined when a task is missing", () => {
    expect(customTaskIds("set-kb-001.gone-1", 10, exists)).toBeUndefined();
  });

  it("is undefined for a set larger than the exam", () => {
    expect(customTaskIds("set-kb-001.log-002", 1, exists)).toBeUndefined();
  });

  it("is undefined for an id that is not a set", () => {
    expect(customTaskIds("ftn-p1-2025", 10, exists)).toBeUndefined();
  });
});
