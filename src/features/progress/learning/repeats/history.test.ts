import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { at, days, reveal, submit, taskLog } from "../task-log.fixture";
import { taskHistory } from "./history";

describe("taskHistory", () => {
  it("is due after the last try plus its interval", () => {
    const log = taskLog({
      submits: [submit(0, ["wrong"]), submit(days(2), ["wrong"])],
    });
    expect(taskHistory(log, at(days(5)))).toEqual({
      topic: "logarithms",
      difficulty: 3,
      lastResult: "wrong",
      dueAt: at(days(2)) + 3 * dayMs,
      tries: 2,
    });
  });

  it("brings a task studied without an answer back the next day", () => {
    const log = taskLog({ reveals: [reveal(0, "solution")] });
    expect(taskHistory(log, at(days(2)))).toMatchObject({
      lastResult: "wrong",
      dueAt: at(0) + dayMs,
      tries: 1,
    });
  });

  it("is empty without a try", () => {
    expect(
      taskHistory(taskLog({ submits: [submit(0, ["empty"])] }), at(60)),
    ).toBeUndefined();
  });
});
