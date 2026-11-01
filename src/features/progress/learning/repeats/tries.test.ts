import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { at, days, reveal, submit, taskLog } from "../task-log.fixture";
import { tries } from "./tries";

const later = at(days(10));

const resultsOf = (log: Parameters<typeof taskLog>[0]) =>
  tries(taskLog(log), later).map((t) => t.result);

describe("tries", () => {
  it("splits the attempts into tries at an hour without events", () => {
    expect(
      tries(
        taskLog({
          submits: [submit(0, ["wrong"]), submit(30, ["wrong"])],
          reveals: [reveal(95, "hint1")],
          skips: [at(200)],
        }),
        later,
      ),
    ).toEqual([{ at: at(30), result: "wrong" }]);
    expect(
      tries(
        taskLog({
          submits: [
            submit(0, ["wrong"]),
            submit(90, ["right"]),
            submit(days(1), ["right"]),
          ],
        }),
        later,
      ),
    ).toEqual([
      { at: at(0), result: "wrong" },
      { at: at(90), result: "clean" },
      { at: at(days(1)), result: "clean" },
    ]);
  });

  it("gives each try a result by the rules of the first attempt", () => {
    expect(resultsOf({ submits: [submit(0, ["right"])] })).toEqual(["clean"]);
    expect(
      resultsOf({
        submits: [submit(0, ["wrong"]), submit(2, ["right"])],
      }),
    ).toEqual(["helped"]);
    expect(
      resultsOf({
        submits: [submit(0, ["right", "wrong"])],
        reveals: [reveal(2, "solution")],
      }),
    ).toEqual(["partlyRight"]);
    expect(resultsOf({ submits: [submit(0, ["wrong", "empty"])] })).toEqual([
      "wrong",
    ]);
  });

  it("counts a hint opened between tries toward the next one", () => {
    expect(
      resultsOf({
        submits: [submit(0, ["wrong"]), submit(4 * 60, ["right"])],
        reveals: [reveal(2 * 60, "hint1")],
      }),
    ).toEqual(["wrong", "helped"]);
  });

  it("counts a studied try as wrong", () => {
    expect(
      resultsOf({
        submits: [submit(3, ["right"])],
        reveals: [reveal(1, "answer")],
      }),
    ).toEqual(["wrong"]);
    expect(resultsOf({ reveals: [reveal(1, "solution")] })).toEqual(["wrong"]);
  });

  it("does not count a look at the solution after a solved try", () => {
    expect(
      resultsOf({
        submits: [submit(0, ["right"])],
        reveals: [reveal(3 * 60, "solution"), reveal(days(2), "answer")],
      }),
    ).toEqual(["clean"]);
    expect(
      resultsOf({
        submits: [submit(0, ["wrong"])],
        reveals: [reveal(3 * 60, "solution")],
      }),
    ).toEqual(["wrong", "wrong"]);
  });

  it("leaves out a try that is still open", () => {
    const log = taskLog({
      submits: [submit(0, ["right"]), submit(days(1), ["wrong"])],
    });
    expect(tries(log, at(days(1) + 30))).toEqual([
      { at: at(0), result: "clean" },
    ]);
    expect(tries(log, at(days(1)) + dayMs)).toHaveLength(2);
  });

  it("keeps a try checked against another answer key", () => {
    expect(resultsOf({ submits: [submit(0, ["right"], "k0")] })).toEqual([
      "clean",
    ]);
  });

  it("finds no tries in answers that are only empty", () => {
    expect(resultsOf({ submits: [submit(0, ["empty"])] })).toEqual([]);
  });
});
