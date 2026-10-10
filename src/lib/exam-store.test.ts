import { afterEach, describe, expect, it, vi } from "vitest";
import { type ExamRun, useExamStore } from "./exam-store";

const meta = {
  title: "2026",
  minutes: 48,
  timed: true,
  tasks: [
    { number: 1, topic: "a", parts: 2 },
    { number: 2, topic: "b", parts: 1 },
  ],
};

const saved: ExamRun = {
  runId: "00000000-0000-4000-8000-000000000000",
  title: "2026",
  minutes: 48,
  timed: true,
  tasks: [{ number: 1, topic: "a" }],
  startedAt: 0,
  enteredAt: 0,
  updatedAt: 0,
  current: 0,
  answers: [["y"]],
  spent: [0],
};

const store = () => useExamStore.getState();
const run = () => store().runs.v;

afterEach(() => {
  store().clear("v");
  vi.useRealTimers();
});

describe("exam store", () => {
  it("starts a run once with empty answers", () => {
    store().start("v", meta);
    const first = run()?.runId;
    store().start("v", meta);
    expect(run()?.runId).toBe(first);
    expect(run()?.answers).toEqual([["", ""], [""]]);
    expect(run()?.tasks).toEqual([
      { number: 1, topic: "a" },
      { number: 2, topic: "b" },
    ]);
  });

  it("answers parts of the current task", () => {
    store().start("v", meta);
    store().answer("v", 1, "x");
    expect(run()?.answers).toEqual([["", "x"], [""]]);
  });

  it("adds the time spent to the task being left", () => {
    vi.useFakeTimers({ now: 0 });
    store().start("v", meta);
    vi.setSystemTime(90_000);
    store().go("v", 1);
    vi.setSystemTime(120_000);
    store().go("v", 0);
    expect(run()?.spent).toEqual([90_000, 30_000]);
    expect(run()?.current).toBe(0);
  });

  it("restores a run for a variant without one", () => {
    store().restore("v", saved);
    expect(run()).toEqual(saved);
  });

  it("keeps a newer local run when restoring", () => {
    store().start("v", meta);
    store().answer("v", 0, "x");
    const local = run();
    store().restore("v", saved);
    expect(run()).toBe(local);
  });

  it("replaces an older local run when restoring", () => {
    store().start("v", meta);
    const newer = { ...saved, updatedAt: Date.now() + 1 };
    store().restore("v", newer);
    expect(run()).toBe(newer);
  });

  it("clears a run", () => {
    store().start("v", meta);
    store().clear("v");
    expect(run()).toBeUndefined();
  });
});
