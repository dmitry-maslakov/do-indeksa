import { type SQLWrapper, sql } from "drizzle-orm";

export const epochMs = (value: SQLWrapper) =>
  sql<number>`extract(epoch from ${value}) * 1000`.mapWith(Number);
