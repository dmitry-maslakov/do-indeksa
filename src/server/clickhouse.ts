import "server-only";
import { createClient } from "@clickhouse/client";
import { retry } from "es-toolkit";
import { secondMs } from "@/lib/dates";
import { env } from "./env";

const client =
  env.ANALYTICS_CLICKHOUSE_URL &&
  createClient({
    url: env.ANALYTICS_CLICKHOUSE_URL,
    request_timeout: 5 * secondMs,
  });

export async function insertEvents(rows: object[], token: string) {
  if (!client) return;
  await retry(
    () =>
      client.insert({
        table: "analytics.events",
        format: "JSONEachRow",
        values: rows,
        clickhouse_settings: {
          insert_deduplication_token: token,
          date_time_input_format: "best_effort",
        },
      }),
    {
      retries: 5,
      delay: (attempt) => (2 ** attempt + Math.random()) * secondMs,
    },
  );
}
