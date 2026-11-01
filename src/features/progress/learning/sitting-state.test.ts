import { describe, expect, it } from "vitest";
import { defaultPolicy } from "./policy";
import { afterShown, openSitting, sittingState } from "./sitting-state";
import { at, days, reveal, stored, taskLog } from "./task-log.fixture";
import type { StoredSubmit, TaskLog } from "./types";

type Over = Partial<TaskLog<StoredSubmit>>;

const gap = defaultPolicy.attemptGapMs;

const stateAt = (minutes: number, log: Over) =>
  sittingState(taskLog<StoredSubmit>(log), at(minutes), gap);

describe("sittingState", () => {
  it("is open when nothing was done", () => {
    expect(stateAt(5, {})).toEqual(openSitting);
  });

  it("keeps a hint opened alone open, for an hour", () => {
    const reveals = [reveal(1, "hint1"), reveal(2, "hint2")];
    expect(stateAt(5, { reveals })).toEqual({ ...openSitting, hints: 2 });
    expect(stateAt(1 + 60, { reveals })).toMatchObject({ hints: 1 });
    expect(stateAt(2 + 60, { reveals })).toEqual(openSitting);
  });

  it("forgets the hints of a sitting that ended an hour ago", () => {
    expect(
      stateAt(days(1), {
        submits: [stored(2, ["wrong"], ["3"])],
        reveals: [reveal(1, "hint1")],
      }),
    ).toEqual(openSitting);
  });

  it("ignores an answer given under another key", () => {
    expect(
      stateAt(5, {
        submits: [{ ...stored(1, ["right"], ["2"]), keyRev: "k0" }],
      }),
    ).toEqual(openSitting);
    expect(
      stateAt(5, {
        submits: [
          { ...stored(1, ["right"], ["2"]), keyRev: "k0" },
          stored(2, ["wrong"], ["3"]),
        ],
      }),
    ).toMatchObject({ correct: false, solved: [undefined] });
  });

  it("stays open after a wrong answer and keeps the hints", () => {
    expect(
      stateAt(10, {
        submits: [stored(2, ["wrong"], ["3"])],
        reveals: [reveal(1, "hint1"), reveal(1, "hint1"), reveal(3, "hint2")],
      }),
    ).toEqual({
      hints: 2,
      answer: false,
      solution: false,
      correct: false,
      solved: [undefined],
    });
  });

  it("is closed by a right answer and remembers what was typed", () => {
    expect(
      stateAt(10, {
        submits: [stored(1, ["wrong"], ["3"]), stored(2, ["right"], ["2"])],
      }),
    ).toMatchObject({ correct: true, solved: ["2"] });
  });

  it("keeps the parts solved alone while the others stay open", () => {
    expect(
      stateAt(10, {
        submits: [stored(1, ["right", "wrong", "empty"], ["5", "1", ""])],
      }),
    ).toEqual({
      hints: 0,
      answer: false,
      solution: false,
      correct: false,
      solved: ["5", undefined, undefined],
    });
  });

  it("is closed by Rezultat", () => {
    expect(
      stateAt(10, {
        submits: [stored(1, ["wrong"], ["3"])],
        reveals: [reveal(2, "answer")],
      }),
    ).toMatchObject({ answer: true, solution: false, correct: false });
  });

  it("is closed by the solution, also one opened after Rezultat", () => {
    expect(stateAt(10, { reveals: [reveal(2, "solution")] })).toMatchObject({
      answer: false,
      solution: true,
    });
    expect(
      stateAt(10, { reveals: [reveal(2, "answer"), reveal(3, "solution")] }),
    ).toMatchObject({ answer: true, solution: true });
  });

  it("keeps a right answer given before the result was opened", () => {
    expect(
      stateAt(10, {
        submits: [stored(1, ["right"], ["2"])],
        reveals: [reveal(2, "solution")],
      }),
    ).toMatchObject({ correct: true, solution: true, solved: ["2"] });
  });

  it("does not take an answer given after the result was opened", () => {
    expect(
      stateAt(10, {
        submits: [
          stored(1, ["right", "wrong"], ["5", "1"]),
          stored(3, ["right", "right"], ["5", "4"]),
        ],
        reveals: [reveal(2, "answer")],
      }),
    ).toMatchObject({
      answer: true,
      correct: false,
      solved: ["5", undefined],
    });
    expect(
      stateAt(10, {
        submits: [stored(3, ["right"], ["2"])],
        reveals: [reveal(2, "answer")],
      }),
    ).toMatchObject({ answer: true, correct: false, solved: [] });
  });

  it("is open again an hour after the last event", () => {
    const log = {
      submits: [stored(1, ["right"], ["2"])],
      reveals: [reveal(2, "solution")],
    };
    expect(stateAt(2 + 59, log)).toMatchObject({ correct: true });
    expect(stateAt(2 + 60, log)).toEqual(openSitting);
  });

  it("counts a skip as part of the sitting", () => {
    const log = {
      submits: [stored(1, ["wrong"], ["3"])],
      reveals: [reveal(2, "answer")],
      skips: [at(50)],
    };
    expect(stateAt(100, log)).toMatchObject({ answer: true });
    expect(stateAt(111, log)).toEqual(openSitting);
  });

  it("starts a new sitting after the hour, even when the last was closed by a reveal", () => {
    expect(
      stateAt(days(1), {
        submits: [
          stored(1, ["wrong"], ["3"]),
          stored(days(1) - 5, ["wrong"], ["4"]),
        ],
        reveals: [reveal(2, "solution"), reveal(days(1) - 6, "hint1")],
      }),
    ).toEqual({
      hints: 1,
      answer: false,
      solution: false,
      correct: false,
      solved: [undefined],
    });
  });
});

describe("afterShown", () => {
  const given = (log: Over) =>
    afterShown(taskLog<StoredSubmit>(log), at(days(30)), gap).map((s) => s.id);

  it("finds an answer given after the result in the same sitting", () => {
    expect(
      given({
        submits: [stored(1, ["wrong"], ["3"]), stored(5, ["right"], ["2"])],
        reveals: [reveal(3, "answer")],
      }),
    ).toEqual(["attempt-5"]);
  });

  it("finds an answer given after the solution when the break was short", () => {
    expect(
      given({
        submits: [stored(100, ["right"], ["2"])],
        reveals: [reveal(0, "solution")],
        skips: [at(50)],
      }),
    ).toEqual(["attempt-100"]);
  });

  it("leaves an answer given before the reveal", () => {
    expect(
      given({
        submits: [stored(1, ["right"], ["2"])],
        reveals: [reveal(3, "solution")],
      }),
    ).toEqual([]);
  });

  it("leaves an answer given in a later sitting", () => {
    expect(
      given({
        submits: [stored(120, ["right"], ["2"])],
        reveals: [reveal(0, "answer")],
      }),
    ).toEqual([]);
  });

  it("leaves an answer given after a hint only", () => {
    expect(
      given({
        submits: [stored(5, ["right"], ["2"])],
        reveals: [reveal(1, "hint1")],
      }),
    ).toEqual([]);
  });

  it("leaves an answer that decides nothing to the status rule", () => {
    expect(
      given({
        submits: [stored(5, ["empty"], [""])],
        reveals: [reveal(1, "answer")],
      }),
    ).toEqual([]);
  });
});
