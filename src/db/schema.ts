import { isNull } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
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
import type { TestDraft } from "@/features/exam/test-draft";
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

export const testKind = pgEnum("test_kind", [
  "official",
  "curated",
  "daily",
  "random",
  "custom",
]);

export const testSessions = pgTable(
  "test_sessions",
  {
    id: uuid().primaryKey(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: testKind().notNull(),
    variantId: text().notNull(),
    taskIds: text().array().notNull(),
    timed: boolean().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp({ withTimezone: true }),
    overtime: boolean(),
    draft: jsonb().$type<TestDraft>(),
  },
  (t) => [
    unique().on(t.id, t.profileId),
    index().on(t.profileId, t.updatedAt.desc()),
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
    testSessionId: uuid(),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.id, t.profileId, t.taskId),
    index().on(t.profileId, t.taskId, t.startedAt.desc()),
    index().on(t.testSessionId),
    foreignKey({
      columns: [t.testSessionId, t.profileId],
      foreignColumns: [testSessions.id, testSessions.profileId],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

const inTaskSession = (t: {
  sessionId: AnyPgColumn;
  profileId: AnyPgColumn;
  taskId: AnyPgColumn;
}) =>
  foreignKey({
    columns: [t.sessionId, t.profileId, t.taskId],
    foreignColumns: [
      taskSessions.id,
      taskSessions.profileId,
      taskSessions.taskId,
    ],
  })
    .onDelete("cascade")
    .onUpdate("cascade");

export const attempts = pgTable(
  "attempts",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    sessionId: uuid().notNull(),
    answers: text().array().notNull(),
    outcomes: partOutcome().array().notNull(),
    correct: boolean().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.profileId, t.createdAt.desc()),
    index().on(t.profileId, t.taskId, t.createdAt.desc()),
    index().on(t.sessionId),
    inTaskSession(t),
  ],
);

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
    sessionId: uuid().notNull(),
    part: revealPart().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.profileId, t.taskId, t.createdAt.desc()),
    index().on(t.sessionId),
    inTaskSession(t),
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
