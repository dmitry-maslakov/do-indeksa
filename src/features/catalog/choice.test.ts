import { describe, expect, it } from "vitest";
import {
  type Choice,
  choiceProblem,
  choiceResult,
  gradeChoice,
  isShort,
  keyOf,
  pickedOf,
  sentOf,
} from "./choice";

const one: Choice = {
  many: false,
  options: ["$1$", "$2$", "$3$"],
  correct: ["B"],
};

const many: Choice = {
  many: true,
  options: ["p", "q", "r", "s", "t"],
  correct: ["A", "B", "D"],
};

describe("gradeChoice", () => {
  it("grades a single choice as one answer", () => {
    expect(gradeChoice(one, ["B"])).toEqual(["right"]);
    expect(gradeChoice(one, ["C"])).toEqual(["wrong"]);
    expect(gradeChoice(one, [""])).toEqual(["empty"]);
    expect(gradeChoice(one, [])).toEqual(["empty"]);
  });

  it("does not read a letter outside the options", () => {
    expect(gradeChoice(one, ["D"])).toEqual(["unreadable"]);
    expect(gradeChoice(one, ["x"])).toEqual(["unreadable"]);
  });

  it("grades each option of a multiple choice", () => {
    expect(gradeChoice(many, ["A", "", "C", "D", ""])).toEqual([
      "right",
      "wrong",
      "wrong",
      "right",
      "right",
    ]);
    expect(gradeChoice(many, ["A", "B", "", "D", ""])).toEqual(
      Array(5).fill("right"),
    );
  });

  it("leaves a multiple choice with nothing marked empty", () => {
    expect(gradeChoice(many, ["", "", "", "", ""])).toEqual(
      Array(5).fill("empty"),
    );
  });
});

describe("sent answers", () => {
  it("sends one letter for a single choice", () => {
    expect(sentOf(one, ["C"])).toEqual(["C"]);
    expect(sentOf(one, [])).toEqual([""]);
  });

  it("sends a slot per option for a multiple choice", () => {
    expect(sentOf(many, ["D", "A"])).toEqual(["A", "", "", "D", ""]);
    expect(pickedOf(["A", "", "", "D", ""])).toEqual(["A", "D"]);
  });

  it("sends the key as a right answer", () => {
    expect(gradeChoice(one, keyOf(one))).toEqual(["right"]);
    expect(gradeChoice(many, keyOf(many))).toEqual(Array(5).fill("right"));
  });
});

describe("choiceProblem", () => {
  it("accepts a well formed choice", () => {
    expect(choiceProblem(one)).toBeUndefined();
    expect(choiceProblem(many)).toBeUndefined();
  });

  it("names a correct letter outside the options", () => {
    expect(choiceProblem({ ...one, correct: ["E"] })).toBe(
      '"E" is not an option, they end at C',
    );
  });

  it("asks for many when a single choice has several correct options", () => {
    expect(choiceProblem({ ...one, correct: ["A", "B"] })).toMatch(
      /set many: true/,
    );
  });

  it("rejects repeated letters and options", () => {
    expect(choiceProblem({ ...many, correct: ["A", "A"] })).toMatch(/twice/);
    expect(choiceProblem({ ...one, options: ["$1$", "$2$", "$1$"] })).toBe(
      "option C repeats an earlier option",
    );
  });
});

describe("choiceResult", () => {
  it("lists the correct options with their letters", () => {
    expect(choiceResult(many)).toBe("**A)** p\n\n**B)** q\n\n**D)** s");
  });
});

describe("isShort", () => {
  it("keeps numbers and words short and formulas that grow tall long", () => {
    expect(isShort("$0$")).toBe(true);
    expect(isShort("beskonačno mnogo")).toBe(true);
    expect(isShort("$\\dfrac{1+2a}{2+a}$")).toBe(false);
    expect(isShort("Funkcija opada na intervalu $(0,+\\infty)$.")).toBe(false);
  });
});
