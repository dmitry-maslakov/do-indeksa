import { describe, expect, it, vi } from "vitest";
import { getTaskLogs } from "./attempt-log";
import { at, days, reveal, submit } from "./learning/task-log.fixture";

const rows = vi.hoisted(() => ({
  submits: [] as object[],
  reveals: [] as object[],
  skips: [] as object[],
}));

vi.mock("@/server/db", () => {
  const query = (found: object[]) => ({
    from: () => query(found),
    innerJoin: () => query(found),
    where: async () => found,
  });
  const rowsOf = (fields: object) => {
    if ("outcomes" in fields) return rows.submits;
    if ("part" in fields) return rows.reveals;
    return rows.skips;
  };
  return { db: { select: (fields: object) => query(rowsOf(fields)) } };
});

const tz = "Europe/Belgrade";

rows.submits = [
  { taskId: "eks-001", kind: "first", tz, ...submit(0, ["wrong"]) },
  { taskId: "eks-001", kind: "retry", tz, ...submit(days(2), ["right"]) },
  { taskId: "eks-002", kind: "mock", tz, ...submit(0, ["right"]) },
];
rows.reveals = [{ taskId: "fun-002", kind: "first", ...reveal(0, "solution") }];
rows.skips = [{ taskId: "eks-001", kind: "retry", at: at(days(3)) }];

const summary = (logs: Awaited<ReturnType<typeof getTaskLogs>>["taskLogs"]) =>
  logs.map((log) => ({
    taskId: log.taskId,
    submits: log.submits.length,
    reveals: log.reveals.length,
    skips: log.skips.length,
  }));

describe("getTaskLogs", () => {
  it("keeps retries and tests out of the first attempts", async () => {
    const { firstAttempts } = await getTaskLogs("p1");
    expect(summary(firstAttempts)).toEqual([
      { taskId: "eks-001", submits: 1, reveals: 0, skips: 0 },
      { taskId: "fun-002", submits: 0, reveals: 1, skips: 0 },
    ]);
  });

  it("logs every session of a task, a task only studied too", async () => {
    const { taskLogs } = await getTaskLogs("p1");
    expect(summary(taskLogs)).toEqual([
      { taskId: "eks-001", submits: 2, reveals: 0, skips: 1 },
      { taskId: "eks-002", submits: 1, reveals: 0, skips: 0 },
      { taskId: "fun-002", submits: 0, reveals: 1, skips: 0 },
    ]);
    expect(taskLogs[0]).toMatchObject({
      topic: "exponential-equations",
      tz,
    });
    expect(taskLogs[2]).toMatchObject({ tz: null });
  });
});
