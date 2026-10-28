import { describe, expect, it } from "vitest";
import { comparisonsOf } from "./comparisons";

describe("comparisonsOf", () => {
  it("renders the given answer and the key", () => {
    const comparison = comparisonsOf([{ taskId: "eks-001", answers: ["3"] }])[
      "eks-001"
    ];
    expect(comparison?.given).toContain('class="katex"');
    expect(comparison?.given).toContain("3");
    expect(comparison?.key).toContain('class="katex"');
    expect(comparison?.key).toContain("2");
  });

  it("leaves out multi-part and unknown tasks", () => {
    expect(
      comparisonsOf([
        { taskId: "kb-003", answers: ["1", "2"] },
        { taskId: "nema-takvog", answers: ["1"] },
      ]),
    ).toEqual({});
  });

  it("renders an empty answer", () => {
    expect(
      comparisonsOf([{ taskId: "eks-001", answers: [] }])["eks-001"]?.given,
    ).toBeTypeOf("string");
  });
});
