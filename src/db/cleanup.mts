import { createClient } from "@clickhouse/client";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { minuteMs } from "@/lib/dates";
import { eraseAnalytics } from "./analytics-erasure";
import { analyticsErasures } from "./schema";

const db = drizzle({
  connection: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "",
  casing: "snake_case",
});

const stale = sql`
  select p.id from profiles p
  where p.user_id is null
    and greatest(
      p.created_at,
      (select max(s.last_seen_at) from task_sessions s where s.profile_id = p.id),
      (select max(t.updated_at) from test_sessions t where t.profile_id = p.id)
    ) < now() - case
      when exists (select 1 from attempts a where a.profile_id = p.id)
        or exists (select 1 from test_sessions t where t.profile_id = p.id)
      then interval '400 days'
      else interval '30 days'
    end
  limit 1000`;

let removed = 0;
for (;;) {
  const { rowCount } = await db.execute(
    sql`delete from profiles where id in (${stale})`,
  );
  if (!rowCount) break;
  removed += rowCount;
}
console.log(`removed ${removed} guest profiles`);

const analyticsUrl = process.env.ANALYTICS_CLEANUP_URL;
if (analyticsUrl) {
  const ids = (
    await db.select({ id: analyticsErasures.profileId }).from(analyticsErasures)
  ).map(({ id }) => id);
  if (ids.length) {
    const client = createClient({
      url: analyticsUrl,
      request_timeout: 10 * minuteMs,
    });
    const erased = await eraseAnalytics(client, ids);
    await client.close();
    await db
      .delete(analyticsErasures)
      .where(inArray(analyticsErasures.profileId, ids));
    console.log(
      `erased analytics of ${erased.profiles} profiles and ${erased.devices} devices`,
    );
  }
}
await db.$client.end();
