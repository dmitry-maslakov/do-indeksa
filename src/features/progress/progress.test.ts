import { describe, expect, it, vi } from "vitest";
import { getTouched } from "./progress";

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
rows.shown = [{ taskId: "c" }, { taskId: "f" }, { taskId: "g" }];
rows.skipped = [{ taskId: "d" }, { taskId: "f" }];

describe("getTouched", () => {
  it("tells what was done with each task a student touched", async () => {
    const { statuses } = await getTouched("p1");
    expect([...statuses]).toEqual([
      ["a", "solved"],
      ["b", "wrong"],
      ["c", "revealed"],
      ["d", "skipped"],
      ["e", "opened"],
      ["f", "revealed"],
      ["g", "wrong"],
    ]);
  });

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

  it("has nothing for a visitor without a profile", async () => {
    expect(await getTouched("0")).toEqual({
      touches: [],
      statuses: new Map(),
    });
  });
});
