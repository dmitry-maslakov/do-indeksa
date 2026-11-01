import { describe, expect, it, vi } from "vitest";
import { getTouched, getVisitStatuses } from "./progress";

const rows = vi.hoisted(() => ({
  touches: [] as object[],
  answered: [] as object[],
  shown: [] as object[],
  skipped: [] as object[],
}));

vi.mock("@/server/db", async () => {
  const { reveals } = await import("@/db/schema");
  const query = (found: object[]) => ({
    from: () => query(found),
    innerJoin: () => query(found),
    where: () =>
      Object.assign(Promise.resolve(found), { orderBy: async () => found }),
  });
  return {
    db: {
      select: () => query(rows.touches),
      selectDistinctOn: () => query(rows.answered),
      selectDistinct: () => ({
        from: (table: unknown) =>
          query(table === reveals ? rows.shown : rows.skipped),
      }),
    },
  };
});

vi.mock("@/server/profile", () => ({ noId: "0" }));

vi.mock("./attempt-log", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./attempt-log")>()),
  getPracticeLogsOf: async () => [],
}));

const touch = (taskId: string, from: number) => ({
  taskId,
  kind: "first",
  from,
  to: from + 1,
});

rows.touches = ["a", "b", "c", "d", "e", "f", "g"].map((id, i) => touch(id, i));
rows.answered = [
  { taskId: "a", correct: true, createdAt: new Date(0) },
  { taskId: "b", correct: false, createdAt: new Date(0) },
  { taskId: "g", correct: false, createdAt: new Date(0) },
];
rows.shown = [
  { taskId: "c", kind: "first" },
  { taskId: "e", kind: "mock" },
  { taskId: "f", kind: "retry" },
  { taskId: "g", kind: "first" },
];
rows.skipped = [{ taskId: "d" }, { taskId: "f" }];

describe("getTouched", () => {
  it("returns the touches in the order they were read", async () => {
    const { touches } = await getTouched("p1");
    expect(touches.map((t) => t.taskId)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
    ]);
  });

  it("tells which tasks were answered and how", async () => {
    const { statuses } = await getTouched("p1");
    expect([...statuses]).toEqual([
      ["a", "solved"],
      ["b", "wrong"],
      ["g", "wrong"],
    ]);
  });

  it("has nothing for a visitor without a profile", async () => {
    expect(await getTouched("0")).toEqual({
      touches: [],
      statuses: new Map(),
    });
  });
});

describe("getVisitStatuses", () => {
  it("tells what was done with each task of the visit", async () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g"];
    expect([...(await getVisitStatuses("p1", ids, 0))]).toEqual([
      ["a", "solved"],
      ["b", "wrong"],
      ["c", "revealed"],
      ["d", "skipped"],
      ["e", "opened"],
      ["f", "revealed"],
      ["g", "wrong"],
    ]);
  });

  it("does not call a task revealed for a solution seen in a test", async () => {
    expect([...(await getVisitStatuses("p1", ["e"], 0))]).toEqual([
      ["e", "opened"],
    ]);
  });

  it("asks only for the tasks it was given", async () => {
    const shown = await getVisitStatuses("p1", ["d", "a"], 0);
    expect([...shown]).toEqual([
      ["d", "skipped"],
      ["a", "solved"],
    ]);
  });

  it("has nothing for a visitor without a profile", async () => {
    expect(await getVisitStatuses("0", ["a"], 0)).toEqual(new Map());
  });
});
