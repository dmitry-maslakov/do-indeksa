import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(
  process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "",
);

const stale = sql`
  select p.id from profiles p
  where p.user_id is null
    and greatest(
      p.created_at,
      (select max(s.last_seen_at) from task_sessions s where s.profile_id = p.id),
      (select max(t.updated_at) from test_sessions t where t.profile_id = p.id)
    ) < now() - case
      when exists (select 1 from attempts a where a.profile_id = p.id)
        or exists (select 1 from favorites f where f.profile_id = p.id)
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
await db.$client.end();
