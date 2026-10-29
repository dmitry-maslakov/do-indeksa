import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { minuteMs, secondMs } from "@/lib/dates";
import { env } from "./env";
import { reportServerError } from "./report";

const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5 * secondMs,
    idleTimeoutMillis: 4 * minuteMs,
    query_timeout: 10 * secondMs,
  }).on("error", reportServerError);

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle({ client: pool, schema, casing: "snake_case" });

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
