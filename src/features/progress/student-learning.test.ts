import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dayMs } from "@/lib/dates";
import { getActivity, getTaskLogs } from "./attempt-log";
import {
  at,
  days,
  logStart,
  reveal,
  submit,
  taskLog,
} from "./learning/task-log.fixture";
import type { TaskLog } from "./learning/types";
import { getLearning } from "./student-learning";

vi.mock("./attempt-log", () => ({
  getTaskLogs: vi.fn(),
  getActivity: vi.fn(),
}));

const first = taskLog({ taskId: "log-001", submits: [submit(0, ["wrong"])] });

const repeated: TaskLog = {
  ...first,
  submits: [...first.submits, submit(days(2), ["right"])],
};

const tested = taskLog({ taskId: "log-002", submits: [submit(0, ["right"])] });

const studied = taskLog({
  taskId: "log-003",
  reveals: [reveal(0, "solution")],
});

const learningWith = (profileId: string, taskLogs: TaskLog[]) => {
  vi.mocked(getTaskLogs).mockResolvedValue({
    firstAttempts: [first],
    taskLogs,
  });
  return getLearning(profileId);
};

beforeEach(() => {
  vi.useFakeTimers({ now: logStart + 3 * dayMs });
  vi.mocked(getActivity).mockResolvedValue([
    { taskId: "log-001", topic: "logarithms", tz: null, at: at(days(2)) },
  ]);
});

afterEach(() => vi.useRealTimers());

describe("getLearning", () => {
  it("schedules a repeat without changing the ability or the status", async () => {
    const once = await learningWith("once", [first]);
    const twice = await learningWith("twice", [repeated, tested]);
    expect(twice.topics).toEqual(once.topics);
    expect(twice.tasks.get("log-002")).toMatchObject({ lastResult: "clean" });
    expect(once.tasks.get("log-001")).toMatchObject({
      lastResult: "wrong",
      tries: 1,
    });
    expect(twice.tasks.get("log-001")).toMatchObject({
      lastResult: "clean",
      dueAt: at(days(2)) + 30 * dayMs,
      tries: 2,
    });
  });

  it("brings a task back the day after its solution was studied", async () => {
    const learning = await learningWith("studied", [first, studied]);
    expect(learning.tasks.get("log-003")).toMatchObject({
      lastResult: "wrong",
      dueAt: at(0) + dayMs,
    });
  });
});
