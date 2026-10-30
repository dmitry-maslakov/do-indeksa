import "server-only";
import { compact, mapValues, omitBy, retry } from "es-toolkit";
import { secondMs } from "@/lib/dates";
import { siteUrl } from "@/lib/site";
import type { Tracked } from "./analytics";
import { env } from "./env";

const {
  OPENPANEL_API_URL: api,
  OPENPANEL_CLIENT_ID: clientId,
  OPENPANEL_CLIENT_SECRET: clientSecret,
} = env;
const target =
  api && clientId && clientSecret
    ? { url: new URL("/track", api), clientId, clientSecret }
    : undefined;
const timeoutMs = 2 * secondMs;
const serverAgent = "do-indeksa/1";
const identifying = new Set(["profile_created", "signed_in"]);

export function toOpenPanel({ row, page, profileId, visitor }: Tracked) {
  return {
    type: "track",
    payload: {
      name: row.name === "page_view" ? "screen_view" : row.name,
      profileId: profileId ?? visitor.aid,
      properties: {
        ...mapValues(
          omitBy(row.props, (_, key) => key.endsWith("profile_id")),
          (value) => (Array.isArray(value) ? value.join(",") : value),
        ),
        route: row.route,
        locale: row.locale,
        source: row.source,
        __path: (page?.url ?? siteUrl).href,
        __referrer: page?.referrer?.origin,
        __timestamp: row.ts,
      },
    },
  };
}

export function identifyOf({ row, profileId }: Tracked) {
  if (!profileId || !identifying.has(row.name)) return;
  const kind = row.name === "profile_created" ? row.props.kind : "account";
  return { type: "identify", payload: { profileId, properties: { kind } } };
}

async function post(
  { url, clientId, clientSecret }: NonNullable<typeof target>,
  tracked: Tracked,
  body: object,
) {
  const browser = tracked.source === "browser";
  const { userAgent, ip } = tracked.visitor;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "openpanel-client-id": clientId,
      "openpanel-client-secret": clientSecret,
      "openpanel-sdk-name": "do-indeksa",
      "openpanel-sdk-version": tracked.row.release,
      "user-agent": browser ? userAgent : serverAgent,
      ...(browser && ip && { "openpanel-client-ip": ip }),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status >= 500)
    throw new Error(`OpenPanel answered ${response.status}`);
  return response.status;
}

export async function sendToOpenPanel(tracked: Tracked[]) {
  if (!target) return;
  let refused: number | undefined;
  for (const item of tracked.filter(({ row }) => !row.bot))
    for (const body of compact([identifyOf(item), toOpenPanel(item)])) {
      const status = await retry(() => post(target, item, body), {
        retries: 1,
        delay: () => Math.random() * secondMs,
      });
      if (status >= 400) refused ??= status;
    }
  if (refused) throw new Error(`OpenPanel refused an event: ${refused}`);
}
