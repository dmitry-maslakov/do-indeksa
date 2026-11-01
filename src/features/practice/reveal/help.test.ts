import { describe, expect, it } from "vitest";
import { cardsOf, helpOf, offered } from "./help";

describe("helpOf", () => {
  it("counts hints and finds what shows the answer", () => {
    expect(helpOf([])).toEqual({
      hints: 0,
      shown: undefined,
      solution: false,
    });
    expect(helpOf([0, 1, "answer", "solution"])).toEqual({
      hints: 2,
      shown: "answer",
      solution: true,
    });
    expect(helpOf([0, "solution", "answer"]).shown).toBe("solution");
  });
});

describe("offered", () => {
  const ladder = { opened: [], hintCount: 2, correct: false };

  it("offers the next hint, the answer and the solution first", () => {
    expect(offered(ladder)).toEqual([0, "answer", "solution"]);
    expect(offered({ ...ladder, opened: [0] })).toEqual([
      1,
      "answer",
      "solution",
    ]);
  });

  it("stops offering hints once they are all open or there are none", () => {
    expect(offered({ ...ladder, opened: [0, 1] })).toEqual([
      "answer",
      "solution",
    ]);
    expect(offered({ ...ladder, hintCount: 0 })).toEqual([
      "answer",
      "solution",
    ]);
  });

  it("leaves only the solution after the answer is shown or solved", () => {
    expect(offered({ ...ladder, opened: [0, "answer"] })).toEqual(["solution"]);
    expect(offered({ ...ladder, correct: true })).toEqual(["solution"]);
    expect(offered({ ...ladder, opened: [0], correct: true })).toEqual([
      "solution",
    ]);
  });

  it("offers nothing once the solution is open", () => {
    expect(offered({ ...ladder, opened: ["solution"] })).toEqual([]);
    expect(offered({ ...ladder, opened: ["solution"], correct: true })).toEqual(
      [],
    );
  });
});

describe("cardsOf", () => {
  it("keeps the answer card only for text the fields cannot show", () => {
    expect(cardsOf([0, "answer"], true)).toEqual([0, "answer"]);
    expect(cardsOf([0, "answer"], false)).toEqual([0]);
  });

  it("drops the answer card next to an open solution", () => {
    expect(cardsOf(["answer", "solution"], true)).toEqual(["solution"]);
  });
});
