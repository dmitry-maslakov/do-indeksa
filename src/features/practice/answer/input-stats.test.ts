import { afterEach, describe, expect, it, vi } from "vitest";
import {
  boxStats,
  countInput,
  countPick,
  focused,
  freshInput,
  latexStats,
  shown,
  takeInput,
} from "./input-stats";

const at = (ms: number) => vi.spyOn(performance, "now").mockReturnValue(ms);
const typed = { inputType: "insertText", data: "2" } as InputEvent;
const defined = Promise.resolve();

const mathlive = (loaded: boolean) =>
  vi.stubGlobal("customElements", {
    get: () => loaded || undefined,
    whenDefined: () => defined,
  });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("latexStats", () => {
  it.each([
    ["\\frac12+x^2", ["frac", "pow"]],
    ["\\sqrt{\\left(4\\right)}", ["sqrt", "paren"]],
    ["\\left(1{,}2\\right\\rbrack", ["interval"]],
    ["\\left\\lbrack1{,}2\\right)", ["interval"]],
    ["\\left(-\\infty{,}2\\right)", ["interval"]],
    ["(-\\infty;-1)\\cup(0;1)", ["interval"]],
    ["(0;1]", ["interval"]],
    ["\\left\\lbrace1{,}2\\right\\rbrace", ["set"]],
    ["\\text{nema rešenja}", ["text"]],
    ["12", undefined],
  ])("lists the structures in %s", (latex, structures) => {
    expect(latexStats([latex]).structures).toEqual(structures);
  });

  it("measures the latex of every field", () => {
    expect(latexStats(["\\frac12", "\\frac{x^2}{3}"])).toEqual({
      latex_len: 20,
      structures: ["frac", "pow"],
    });
  });
});

describe("boxStats", () => {
  it("lists the kinds and counts the boxes that have something", () => {
    expect(
      boxStats(
        [
          { kind: "values" },
          { kind: "interval" },
          { kind: null },
          { kind: "point" },
        ],
        ["1;;3", "(0;1]\\cup\\{5\\}", "\\frac12", ""],
      ),
    ).toEqual({ kinds: ["values", "interval", "value", "point"], boxes: 6 });
  });
});

describe("countPick", () => {
  it("counts a picked option as an input and the first focus", () => {
    at(40);
    const input = freshInput();
    countPick(input);
    at(90);
    countPick(input);
    expect(input).toMatchObject({ inputs: 2, focusAt: 40 });
  });
});

describe("boxStats with a choice", () => {
  it("lists the choice and counts a picked option as one box", () => {
    expect(
      boxStats([{ kind: "value" }, { kind: "choice" }], ["60", "yes"]),
    ).toEqual({ kinds: ["value", "choice"], boxes: 2 });
  });
});

describe("takeInput", () => {
  it("times the field from its showing and caps editing pauses", async () => {
    vi.stubGlobal("window", {});
    mathlive(false);
    const input = { current: freshInput() };
    at(100);
    shown(input.current);
    at(350);
    await defined;
    at(1100);
    focused(input.current);
    for (const ms of [1200, 1500, 60_000]) {
      at(ms);
      countInput(input.current, typed);
    }
    at(61_000);
    expect(takeInput(input)).toEqual({
      inputs: 3,
      deletes: 0,
      pastes: 0,
      vk_inputs: 0,
      vk_toggles: 0,
      text_mode: false,
      field_ready_ms: 250,
      first_focus_ms: 1000,
      focus_to_submit_ms: 59_900,
      edit_ms: 10_300,
    });
    expect(input.current).toEqual(freshInput());
  });

  it("times only the first focus of a field shown again", async () => {
    mathlive(true);
    const input = { current: freshInput() };
    at(100);
    shown(input.current);
    takeInput(input);
    at(200);
    focused(input.current);
    at(300);
    shown(input.current);
    await defined;
    const { field_ready_ms, first_focus_ms, focus_to_submit_ms } =
      takeInput(input);
    expect({ field_ready_ms, first_focus_ms, focus_to_submit_ms }).toEqual({
      focus_to_submit_ms: 100,
    });
  });
});
