import { afterEach, describe, expect, it, vi } from "vitest";
import { minuteMs } from "@/lib/dates";
import { type LocalTest, useTestStore } from "./test-store";

const meta = {
  title: "2026",
  minutes: 48,
  parts: [2, 1],
};

const saved: LocalTest = {
  testId: "00000000-0000-4000-8000-000000000000",
  title: "2026",
  minutes: 48,
  startedAt: 0,
  updatedAt: 0,
  current: 0,
  answers: [["y"]],
  visits: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      task: 0,
      startedAt: 0,
      endedAt: 5000,
    },
  ],
};

const store = () => useTestStore.getState();
const test = () => store().tests.v;

afterEach(() => {
  vi.unstubAllGlobals();
  store().clear("v");
  store().clear("w");
  vi.useRealTimers();
});

describe("exam store", () => {
  it("starts a test once with empty answers", () => {
    store().start("v", meta);
    const first = test()?.testId;
    store().start("v", meta);
    expect(test()?.testId).toBe(first);
    expect(test()?.answers).toEqual([["", ""], [""]]);
  });

  it("answers parts of the current task", () => {
    store().start("v", meta);
    store().answer("v", 1, "x");
    expect(test()?.answers).toEqual([["", "x"], [""]]);
  });

  it("records each visit to a task", () => {
    vi.useFakeTimers({ now: 0 });
    store().start("v", meta);
    vi.setSystemTime(90_000);
    store().go("v", 1);
    vi.setSystemTime(120_000);
    store().go("v", 0);
    expect(
      test()?.visits.map(({ task, startedAt, endedAt }) => ({
        task,
        startedAt,
        endedAt,
      })),
    ).toEqual([
      { task: 0, startedAt: 0, endedAt: 90_000 },
      { task: 1, startedAt: 90_000, endedAt: 120_000 },
      { task: 0, startedAt: 120_000, endedAt: 120_000 },
    ]);
    expect(test()?.current).toBe(0);
  });

  it("restores a test for a variant without one and opens a new visit", () => {
    store().restore("v", saved);
    expect(test()?.answers).toEqual(saved.answers);
    expect(test()?.visits.slice(0, 1)).toEqual(saved.visits);
    expect(test()?.visits).toHaveLength(2);
  });

  it("keeps a newer local test when restoring", () => {
    store().start("v", meta);
    store().answer("v", 0, "x");
    const local = test();
    store().restore("v", saved);
    expect(test()).toBe(local);
  });

  it("replaces an older local test when restoring", () => {
    store().start("v", meta);
    const newer = { ...saved, updatedAt: Date.now() + 1 };
    store().restore("v", newer);
    expect(test()?.testId).toBe(newer.testId);
  });

  it("moves a test to the variant with a swapped task", () => {
    vi.useFakeTimers({ now: 0 });
    store().start("v", meta);
    store().answer("v", 0, "x");
    vi.setSystemTime(minuteMs);
    store().go("v", 1);
    const before = test();
    store().swap("v", "w");
    const swapped = store().tests.w;
    expect(test()).toBeUndefined();
    expect(swapped?.testId).not.toBe(before?.testId);
    expect(swapped?.startedAt).toBe(0);
    expect(swapped?.answers).toEqual([["x", ""], []]);
    expect(swapped?.visits.map((v) => v.task)).toEqual([0, 1]);
  });

  it("answers every part of a swapped task", () => {
    store().start("v", meta);
    store().swap("v", "w");
    store().answer("w", 2, "z");
    expect(store().tests.w?.answers[0]).toEqual(["", "", "z"]);
  });

  it("clears a test", () => {
    store().start("v", meta);
    store().clear("v");
    expect(test()).toBeUndefined();
  });
});

describe("persisted tests", () => {
  it("drops tests stored in an older shape", async () => {
    const items = new Map([
      [
        "do-indeksa-exam",
        JSON.stringify({ state: { tests: { v: saved } }, version: 2 }),
      ],
    ]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
      removeItem: (key: string) => items.delete(key),
    });
    vi.resetModules();
    const { useTestStore: persisted } = await import("./test-store");
    await persisted.persist.rehydrate();
    expect(persisted.getState().tests).toEqual({});
  });
});
