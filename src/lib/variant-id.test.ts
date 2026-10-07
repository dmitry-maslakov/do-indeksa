import { describe, expect, it } from "vitest";
import { parseVariantId, setId } from "./variant-id";

describe("parseVariantId", () => {
  it.each([
    ["daily-2026-10-08", { kind: "daily" }],
    ["random-0a1b2c3d", { kind: "random" }],
    ["set-kb-001.log-002", { kind: "custom", taskIds: ["kb-001", "log-002"] }],
    ["set-kb-001.kb-001", { kind: "custom", taskIds: ["kb-001"] }],
  ])("reads %s", (id, parsed) => {
    expect(parseVariantId(id)).toEqual(parsed);
  });

  it.each([
    "daily-2026-10",
    "random-XYZ",
    "set-",
    "set-a.b.c.d.e.f.g.h.i.j.k",
    "ftn-p1-2025",
  ])("ignores %s", (id) => {
    expect(parseVariantId(id)).toBeUndefined();
  });

  it("round-trips a set", () => {
    expect(parseVariantId(setId(["a-1", "b-2"]))).toEqual({
      kind: "custom",
      taskIds: ["a-1", "b-2"],
    });
  });
});
