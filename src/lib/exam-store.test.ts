import { afterEach, describe, expect, it, vi } from "vitest";
import { DAY } from "./dates";
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

describe("persisted runs", () => {
  const NAME = "do-indeksa-exam";

  const open = async (runs: Record<string, ExamRun>) => {
    const items = new Map([
      [NAME, JSON.stringify({ state: { runs }, version: 2 })],
    ]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
      removeItem: (key: string) => items.delete(key),
    });
    vi.resetModules();
    const { useExamStore: persisted } = await import("./exam-store");
    await persisted.persist.rehydrate();
    const stored = () =>
      Object.keys(JSON.parse(items.get(NAME) ?? "{}").state.runs);
    return { persisted, stored };
  };

  const startedAgo = (ms: number) => ({ ...saved, startedAt: Date.now() - ms });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("drops runs older than a day when hydrating", async () => {
    const { persisted } = await open({
      "daily-2026-01-01": startedAgo(DAY + 1000),
      "set-a.b": startedAgo(3 * DAY),
      "daily-2026-01-03": startedAgo(DAY - 60_000),
      "set-c": startedAgo(0),
    });
    expect(Object.keys(persisted.getState().runs)).toEqual([
      "daily-2026-01-03",
      "set-c",
    ]);
  });

  it("keeps a run younger than a day unchanged", async () => {
    const run = startedAgo(DAY - 60_000);
    const { persisted } = await open({ v: run });
    expect(persisted.getState().runs.v).toEqual(run);
  });

  it("writes only the kept runs back to storage", async () => {
    const { persisted, stored } = await open({
      "daily-2026-01-01": startedAgo(2 * DAY),
      "set-c": startedAgo(0),
    });
    persisted.getState().answer("set-c", 0, "x");
    expect(stored()).toEqual(["set-c"]);
  });

  it("hydrates an empty storage", async () => {
    const { persisted } = await open({});
    expect(persisted.getState().runs).toEqual({});
  });
});
