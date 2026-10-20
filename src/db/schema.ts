import { isNull, sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
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

export const profiles = pgTable("profiles", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  tokenHash: text().unique(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

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
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: runKind().notNull(),
    variantId: text().notNull(),
    taskIds: text().array().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull(),
    finishedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    timed: boolean().notNull(),
    overtime: boolean(),
    durationsMs: integer().array().notNull(),
  },
  (t) => [
    unique().on(t.id, t.profileId),
    index().on(t.profileId, t.finishedAt.desc()),
  ],
);

export const partOutcome = pgEnum("part_outcome", partOutcomes);

export const taskSessions = pgTable(
  "task_sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.id, t.profileId, t.taskId),
    index().on(t.profileId, t.taskId, t.startedAt.desc()),
  ],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    runId: uuid().references(() => runs.id, { onDelete: "cascade" }),
    sessionId: uuid(),
    answers: text().array().notNull(),
    outcomes: partOutcome().array().notNull(),
    correct: boolean().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.profileId, t.createdAt.desc()),
    index().on(t.profileId, t.taskId, t.createdAt.desc()),
    index().on(t.sessionId),
    unique().on(t.runId, t.taskId),
    foreignKey({
      columns: [t.sessionId, t.profileId, t.taskId],
      foreignColumns: [
        taskSessions.id,
        taskSessions.profileId,
        taskSessions.taskId,
      ],
    }).onDelete("cascade"),
    check(
      "attempts_one_owner",
      sql`num_nonnulls(${t.runId}, ${t.sessionId}) = 1`,
    ),
  ],
);

export const currentRuns = pgTable("current_runs", {
  profileId: uuid()
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
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
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.taskId] })],
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
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    sessionId: uuid(),
    runId: uuid(),
    part: revealPart().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.profileId, t.taskId, t.createdAt.desc()),
    index().on(t.sessionId),
    index().on(t.runId),
    foreignKey({
      columns: [t.sessionId, t.profileId, t.taskId],
      foreignColumns: [
        taskSessions.id,
        taskSessions.profileId,
        taskSessions.taskId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.runId, t.profileId],
      foreignColumns: [runs.id, runs.profileId],
    }).onDelete("cascade"),
    check(
      "reveals_one_owner",
      sql`num_nonnulls(${t.runId}, ${t.sessionId}) = 1`,
    ),
  ],
);

export const reportKind = pgEnum("report_kind", reportKinds);

export const reports = pgTable("reports", {
  id: uuid().primaryKey().defaultRandom(),
  taskId: text().notNull(),
  kind: reportKind().notNull(),
  message: text().notNull(),
  profileId: uuid().references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
