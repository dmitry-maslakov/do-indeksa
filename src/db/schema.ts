import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
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
    parts: boolean().array().notNull(),
    correct: boolean().notNull(),
    hintsUsed: smallint().notNull().default(0),
    durationMs: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.userId, t.createdAt.desc()),
    unique().on(t.runId, t.taskId),
  ],
);

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

export const sets = pgTable("sets", {
  code: text().primaryKey(),
  taskIds: text().array().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
