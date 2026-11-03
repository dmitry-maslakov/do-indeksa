import { describe, expect, it } from "vitest";
import { answersOf } from "./comparisons";

const html = (shown: unknown) =>
  shown && typeof shown === "object" && "html" in shown ? shown.html : "";

describe("answersOf", () => {
  it("renders the given answer and the key", () => {
    const [part] =
      answersOf(["eks-001"], [{ taskId: "eks-001", answers: ["3"] }])[
        "eks-001"
      ] ?? [];
    expect(html(part?.given)).toContain('class="katex"');
    expect(html(part?.given)).toContain("3");
    expect(html(part?.key)).toContain("2");
  });

  it("writes the boxes of a list with commas, as the key is written", () => {
    const [part] =
      answersOf(["log-001"], [{ taskId: "log-001", answers: ["4;\\sqrt{2}"] }])[
        "log-001"
      ] ?? [];
    expect(html(part?.given)).toContain('<span class="mpunct">,</span>');
    expect(html(part?.given)).not.toContain('<span class="mpunct">;</span>');
  });

  it("writes tg, ctg and arctg typed with their keys", () => {
    const [part] =
      answersOf(
        ["eks-001"],
        [{ taskId: "eks-001", answers: ["\\tg x+\\ctg x+\\arctg2"] }],
      )["eks-001"] ?? [];
    expect(html(part?.given)).not.toContain("katex-error");
    expect(html(part?.given)).toContain("arctg");
  });

  it("gives every part its key, with or without an answer", () => {
    const answers = answersOf(
      ["kb-003", "eks-001"],
      [{ taskId: "kb-003", answers: ["6", "", " "] }],
    );
    expect(answers["kb-003"]?.map((p) => Boolean(p.given))).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(answers["eks-001"]).toHaveLength(1);
    expect(answers["eks-001"]?.[0]?.given).toBeUndefined();
  });

  it("keeps a yes/no part as yes or no", () => {
    const parts =
      answersOf(
        ["vek-002"],
        [{ taskId: "vek-002", answers: ["", "", "", "no"] }],
      )["vek-002"] ?? [];
    expect(parts[3]).toEqual({ key: { yesno: "yes" }, given: { yesno: "no" } });
  });

  it("skips an unknown task", () => {
    expect(answersOf(["nema-takvog"], [])).toEqual({ "nema-takvog": [] });
  });
});
