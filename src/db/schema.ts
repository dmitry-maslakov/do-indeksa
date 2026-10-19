import { isNull } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ExamRun } from "@/features/exam/exam-store";
import { reportKinds } from "@/features/tasks/report-kinds";
import { partOutcomes } from "@/lib/part-outcome";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const runKind = pgEnum("run_kind", [
  "official",
  "curated",
  "daily",
  "random",
  "custom",
]);

export const runs = pgTable(
  "runs",
  {
    id: uuid().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: runKind().notNull(),
    variantId: text().notNull(),
    taskIds: text().array().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull(),
    finishedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId, t.finishedAt.desc())],
);

export const partOutcome = pgEnum("part_outcome", partOutcomes);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    runId: uuid().references(() => runs.id, { onDelete: "cascade" }),
    answers: text().array().notNull(),
    outcomes: partOutcome().array().notNull(),
    correct: boolean().notNull(),
    hintsUsed: smallint().notNull().default(0),
    durationMs: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.userId, t.createdAt.desc()),
    index().on(t.userId, t.taskId, t.createdAt.desc()),
    unique().on(t.runId, t.taskId),
  ],
);

export const currentRuns = pgTable("current_runs", {
  userId: text()
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  runId: uuid().notNull(),
  variantId: text().notNull(),
  startedAt: timestamp({ withTimezone: true }).notNull(),
  run: jsonb()
    .$type<Omit<ExamRun, "runId" | "startedAt" | "enteredAt">>()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const favorites = pgTable(
  "favorites",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.taskId] })],
);

export const sets = pgTable(
  "sets",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    code: text().unique(),
    taskIds: text().array().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex().on(t.taskIds).where(isNull(t.code))],
);

export const revealPart = pgEnum("reveal_part", [
  "hint1",
  "hint2",
  "hint3",
  "answer",
  "solution",
]);

export const reveals = pgTable(
  "reveals",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    part: revealPart().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId, t.taskId, t.createdAt.desc())],
);

export const reportKind = pgEnum("report_kind", reportKinds);

export const reports = pgTable("reports", {
  id: uuid().primaryKey().defaultRandom(),
  taskId: text().notNull(),
  kind: reportKind().notNull(),
  message: text().notNull(),
  userId: text().references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
