import "server-only";
import { eq, or, sql } from "drizzle-orm";
import { attempts } from "@/db/schema";

export const decidesStatus = or(
  eq(attempts.correct, true),
  sql`'wrong' = any(${attempts.outcomes})`,
);
