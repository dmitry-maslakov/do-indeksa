import type { ClickHouseClient } from "@clickhouse/client";

interface ErasureTarget {
  table: string;
  columns: string[];
}

const matches: Record<string, string> = {
  profile_id: "profile_id IN {ids:Array(String)}",
  id: "id IN {ids:Array(String)}",
};

const mergedGuests = `
  SELECT DISTINCT toString(props.from_profile_id) AS id
  FROM analytics.events
  WHERE name = 'profile_merged' AND profile_id IN {ids:Array(UUID)}`;

const aidsOf = `
  SELECT DISTINCT aid
  FROM analytics.events
  WHERE profile_id IN {ids:Array(UUID)} AND notEmpty(aid)`;

const eventsDelete = `
  ALTER TABLE analytics.events
  DELETE WHERE profile_id IN {ids:Array(UUID)} OR aid IN {aids:Array(UUID)}`;

const openPanelTargets = `
  SELECT table, groupArray(name) AS columns
  FROM system.columns
  WHERE database = 'openpanel'
    AND table IN (
      SELECT name FROM system.tables
      WHERE database = 'openpanel' AND engine LIKE '%MergeTree'
    )
    AND (
      name = 'profile_id' AND type = 'String'
      OR name = 'id' AND startsWith(table, 'profiles')
    )
  GROUP BY table`;

export const openPanelDelete = ({ columns }: ErasureTarget) =>
  `ALTER TABLE openpanel.{table:Identifier} DELETE WHERE ${columns
    .map((column) => matches[column])
    .join(" OR ")}`;

async function select<Row>(
  client: ClickHouseClient,
  query: string,
  params?: Record<string, unknown>,
) {
  const result = await client.query({
    query,
    query_params: params,
    format: "JSONEachRow",
  });
  return result.json<Row>();
}

export async function eraseAnalytics(
  client: ClickHouseClient,
  profileIds: string[],
) {
  const guests = await select<{ id: string }>(client, mergedGuests, {
    ids: profileIds,
  });
  const ids = [...profileIds, ...guests.map(({ id }) => id)];
  const aids = (await select<{ aid: string }>(client, aidsOf, { ids })).map(
    ({ aid }) => aid,
  );
  const settings = { mutations_sync: "1" } as const;
  await client.command({
    query: eventsDelete,
    query_params: { ids, aids },
    clickhouse_settings: settings,
  });
  for (const target of await select<ErasureTarget>(client, openPanelTargets))
    await client.command({
      query: openPanelDelete(target),
      query_params: { table: target.table, ids: [...ids, ...aids] },
      clickhouse_settings: settings,
    });
  return { profiles: ids.length, devices: aids.length };
}
