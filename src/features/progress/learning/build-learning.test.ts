import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { learningAsOf } from "./build-learning";
import { at, days, logStart, submit, taskLog } from "./task-log.fixture";

const log = taskLog({
  taskId: "log-001",
  submits: [submit(0, ["wrong"]), submit(days(2), ["right"])],
});

const evidence = {
  logs: { firstAttempts: [log], taskLogs: [log] },
  activity: [0, days(2)].map((minutes) => ({
    taskId: "log-001",
    topic: "logarithms",
    tz: null,
    at: at(minutes),
  })),
};

const now = logStart + 3 * dayMs;

describe("learningAsOf", () => {
  const learningAt = learningAsOf(evidence, now);

  it("folds the log up to the moment", () => {
    const earlier = learningAt(logStart + dayMs);
    expect(earlier.tasks.get("log-001")).toMatchObject({
      lastResult: "wrong",
      tries: 1,
      lastTryAt: at(0),
    });
    expect(earlier.topics.get("logarithms")?.status.lastAt).toBe(at(0));
  });

  it("uses everything logged by the present", () => {
    const present = learningAt(now);
    expect(present.tasks.get("log-001")).toMatchObject({
      lastResult: "clean",
      tries: 2,
    });
    expect(present.topics.get("logarithms")?.status.lastAt).toBe(at(days(2)));
  });

  it("leaves out what is logged at the moment itself", () => {
    expect(learningAt(at(0)).tasks.size).toBe(0);
  });
});
