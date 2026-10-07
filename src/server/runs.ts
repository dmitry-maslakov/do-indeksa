"use server";

import { z } from "zod";
import { getTask } from "@/content/tasks";
import { getVariant, pointsOf } from "@/content/variants";
import { attempts, runs } from "@/db/schema";
import { isEquivalent } from "@/lib/math";
import { getSession } from "./auth";
import { db } from "./db";

export interface RunResult {
  saved: boolean;
  answered: boolean[];
  parts: boolean[][];
  points: number[];
}

const DAY = 24 * 60 * 60 * 1000;

const input = z.object({
  runId: z.uuid(),
  variantId: z.string().min(1),
  startedAt: z.number().int(),
  answers: z.array(z.array(z.string().max(500)).max(6)).max(10),
  durations: z.array(z.number().int().min(0)).max(10),
});

export async function finishRun(
  data: z.input<typeof input>,
): Promise<RunResult> {
  const run = input.parse(data);
  const variant = getVariant(run.variantId);
  if (!variant) throw new Error(`unknown variant ${run.variantId}`);
  const now = Date.now();
  if (run.startedAt > now || run.startedAt < now - DAY) {
    throw new Error("run is out of time bounds");
  }

  const graded = variant.taskIds.map((taskId, i) => {
    const task = getTask(taskId);
    const answers = run.answers[i] ?? [];
    const parts = (task?.check ?? []).map((c, j) =>
      isEquivalent(answers[j] ?? "", c.expected),
    );
    const durationMs = Math.min(run.durations[i] ?? 0, DAY);
    return {
      taskId,
      answers,
      parts,
      correct: parts.every(Boolean),
      durationMs,
    };
  });
  const result = {
    answered: graded.map((g) => g.answers.some(Boolean)),
    parts: graded.map((g) => g.parts),
    points: graded.map((g) => (g.correct ? pointsOf(g.taskId) : 0)),
  };

  const session = await getSession();
  if (!session) return { saved: false, ...result };

  const userId = session.user.id;
  await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(runs)
      .values({
        id: run.runId,
        userId,
        kind: variant.kind,
        variantId: variant.id,
        taskIds: variant.taskIds,
        startedAt: new Date(run.startedAt),
      })
      .onConflictDoNothing()
      .returning({ id: runs.id });
    const answered = graded.filter((g) => g.answers.some(Boolean));
    if (!inserted || answered.length === 0) return;
    await tx
      .insert(attempts)
      .values(answered.map((g) => ({ ...g, userId, runId: run.runId })));
  });
  return { saved: true, ...result };
}
