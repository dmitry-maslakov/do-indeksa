import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultPolicy } from "./learning/policy";
import { openSitting } from "./learning/sitting-state";
import { days, reveal, stored, taskLog } from "./learning/task-log.fixture";
import type { StoredSubmit, TaskLog } from "./learning/types";
import { getAfterShown, getSittingState } from "./sitting";

const found = vi.hoisted(() => ({
  logs: [] as object[],
  shown: new Set<string>(),
}));

vi.mock("./attempt-log", () => ({
  getPracticeLogsOf: async () => found.logs,
  getShownTasks: async () => found.shown,
}));

vi.mock("@/server/profile", () => ({ noId: "0" }));

const log = (
  taskId: string,
  over: Partial<TaskLog<StoredSubmit>>,
): TaskLog<StoredSubmit> => ({ ...taskLog<StoredSubmit>(over), taskId });

beforeEach(() => {
  found.logs = [];
  found.shown = new Set();
});

describe("getSittingState", () => {
  const opened = (agoMs: number) => [
    log("a", { reveals: [{ at: Date.now() - agoMs, part: "answer" }] }),
  ];

  it("is closed by a result opened within the hour", async () => {
    found.logs = opened(defaultPolicy.attemptGapMs / 2);
    expect(await getSittingState("p1", "a")).toMatchObject({ answer: true });
  });

  it("is open again once the hour has passed", async () => {
    found.logs = opened(defaultPolicy.attemptGapMs * 2);
    expect(await getSittingState("p1", "a")).toEqual(openSitting);
  });

  it("is open for a task nobody worked on", async () => {
    expect(await getSittingState("p1", "a")).toEqual(openSitting);
  });
});

describe("getAfterShown", () => {
  it("lists the answers given after a reveal in the same sitting", async () => {
    found.shown = new Set(["a", "b", "c"]);
    found.logs = [
      log("a", {
        submits: [stored(5, ["right"], ["2"])],
        reveals: [reveal(0, "answer")],
      }),
      log("b", {
        submits: [stored(days(1), ["right"], ["2"])],
        reveals: [reveal(0, "solution")],
      }),
      log("c", {
        submits: [stored(0, ["right"], ["2"])],
        reveals: [reveal(5, "solution")],
      }),
    ];
    expect(await getAfterShown("p1")).toEqual([
      { id: "attempt-5", taskId: "a" },
    ]);
  });

  it("reads nothing when no task had a reveal", async () => {
    found.logs = [
      log("a", {
        submits: [stored(5, ["right"], ["2"])],
        reveals: [reveal(0, "answer")],
      }),
    ];
    expect(await getAfterShown("p1")).toEqual([]);
  });

  it("has nothing for a visitor without a profile", async () => {
    found.shown = new Set(["a"]);
    expect(await getAfterShown("0")).toEqual([]);
  });
});
