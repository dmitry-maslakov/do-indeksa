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
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import {
  partOutcomes,
  reportKinds,
  sessionKinds,
  suggestionReasons,
  type TestDraft,
} from "./columns";

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

export const sessionKind = pgEnum("session_kind", sessionKinds);

export const taskSessions = pgTable(
  "task_sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    testSessionId: uuid(),
    kind: sessionKind().notNull(),
    tz: text(),
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
    clientId: uuid().notNull().defaultRandom(),
    answers: text().array().notNull(),
    outcomes: partOutcome().array().notNull(),
    correct: boolean().notNull(),
    difficulty: smallint().notNull(),
    keyRev: text().notNull(),
    checker: smallint().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.profileId, t.createdAt.desc()),
    index().on(t.profileId, t.taskId, t.createdAt.desc()),
    index().on(t.sessionId),
    unique().on(t.profileId, t.clientId),
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

export const skips = pgTable(
  "skips",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: text().notNull(),
    sessionId: uuid().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.profileId, t.taskId, t.createdAt.desc()),
    index().on(t.sessionId),
    inTaskSession(t),
  ],
);

export const suggestionReason = pgEnum("suggestion_reason", suggestionReasons);

export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    topic: text().notNull(),
    reason: suggestionReason().notNull(),
    shownAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    openedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.profileId, t.topic, t.shownAt.desc())],
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
