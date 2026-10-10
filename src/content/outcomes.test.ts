import { describe, expect, it } from "vitest";
import { outcomesOf } from "./outcomes";

describe("outcomesOf", () => {
  it("renders the given answer and the key", () => {
    const outcome = outcomesOf([{ taskId: "eks-001", answers: ["3"] }])[
      "eks-001"
    ];
    expect(outcome?.given).toContain('class="katex"');
    expect(outcome?.given).toContain("3");
    expect(outcome?.key).toContain('class="katex"');
    expect(outcome?.key).toContain("2");
  });

  it("leaves out multi-part and unknown tasks", () => {
    expect(
      outcomesOf([
        { taskId: "kb-003", answers: ["1", "2"] },
        { taskId: "nema-takvog", answers: ["1"] },
      ]),
    ).toEqual({});
  });

  it("renders an empty answer", () => {
    expect(
      outcomesOf([{ taskId: "eks-001", answers: [] }])["eks-001"]?.given,
    ).toBeTypeOf("string");
  });
});
