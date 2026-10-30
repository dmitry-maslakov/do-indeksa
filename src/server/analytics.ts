import "server-only";
import { randomUUID } from "node:crypto";
import { throttle } from "es-toolkit";
import { isbot } from "isbot";
import { cookies, headers } from "next/headers";
import {
  after,
  type NextRequest,
  type NextResponse,
  userAgent,
} from "next/server";
import { z } from "zod";
import {
  aidCookie,
  analyticsCookieAge,
  consentCookie,
  utmOnly,
} from "@/lib/analytics-browser";
import type {
  BrowserEvent,
  EventDefinition,
  ParsedEvent,
} from "@/lib/analytics-schema";
import { minuteMs } from "@/lib/dates";
import { routeOf } from "@/lib/routes";
import { siteUrl } from "@/lib/site";
import { insertEvents } from "./clickhouse";
import { sendToOpenPanel } from "./openpanel";
import { existingProfileId, noId } from "./profile";
import { reportServerError } from "./report";

type Visitor = ReturnType<typeof visitorOf>;

interface Page {
  url: URL;
  referrer?: URL;
}

interface Context {
  source: "server" | "browser";
  at: number;
  profileId?: string;
  page?: Page;
}

export type Tracked = Context & {
  visitor: Visitor;
  row: ReturnType<typeof rowOf>;
};

const release = process.env.NEXT_DEPLOYMENT_ID || "";

const uuid = z.uuid();
const cookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: true,
  maxAge: analyticsCookieAge,
} as const;
const reportDrop = throttle(reportServerError, minuteMs, {
  edges: ["leading"],
});

export function visitorOf(
  headers: Headers,
  jar: Pick<NextRequest["cookies"], "get">,
) {
  const { ua, device, os, browser } = userAgent({ headers });
  return {
    aid: uuid.safeParse(jar.get(aidCookie)?.value).data,
    optedOut:
      jar.get(consentCookie)?.value === "off" || headers.get("sec-gpc") === "1",
    userAgent: ua,
    device: device.type ?? "desktop",
    os: os.name ?? "",
    browser: browser.name ?? "",
    bot: !ua || isbot(ua),
    ip: headers.get("cf-connecting-ip") ?? undefined,
    country: /^[A-Z]{2}$/.exec(headers.get("cf-ipcountry") ?? "")?.[0] ?? "",
  };
}

export function rowOf(
  visitor: Visitor,
  { name, props }: ParsedEvent,
  { source, at, profileId, page }: Context,
) {
  const { locale, route } = page
    ? routeOf(page.url.pathname)
    : { locale: "", route: "" };
  const utm = (key: string) =>
    page?.url.searchParams.get(`utm_${key}`)?.slice(0, 100) ?? "";
  return {
    event_id: randomUUID(),
    ts: new Date(at).toISOString(),
    name,
    source,
    profile_id: profileId ?? noId,
    aid: visitor.aid ?? noId,
    route,
    locale,
    device: visitor.device,
    os: visitor.os,
    browser: visitor.browser,
    country: visitor.country,
    referrer_domain: page?.referrer?.hostname ?? "",
    utm_source: utm("source"),
    utm_medium: utm("medium"),
    utm_campaign: utm("campaign"),
    utm_content: utm("content"),
    utm_term: utm("term"),
    release,
    bot: visitor.bot,
    props,
  };
}

const trackedOf = (
  visitor: Visitor,
  event: ParsedEvent,
  context: Context,
): Tracked => ({ ...context, visitor, row: rowOf(visitor, event, context) });

async function deliver(tracked: Tracked[], token: string) {
  const results = await Promise.allSettled([
    insertEvents(
      tracked.map(({ row }) => row),
      token,
    ),
    sendToOpenPanel(tracked),
  ]);
  for (const result of results)
    if (result.status === "rejected") reportDrop(result.reason);
}

export function trackBatch(
  visitor: Visitor,
  { id, events }: { id: string; events: BrowserEvent[] },
) {
  if (visitor.optedOut || !events.length) return;
  const receivedAt = Date.now();
  after(async () => {
    try {
      const profileId = await existingProfileId();
      const tracked = events.map(({ path, referrer, ago, ...event }) =>
        trackedOf(visitor, event, {
          source: "browser",
          at: receivedAt - ago,
          profileId,
          page: {
            url: utmOnly(new URL(path, siteUrl)),
            referrer: referrer ? new URL(referrer) : undefined,
          },
        }),
      );
      await deliver(tracked, `${visitor.aid ?? noId}:${id}`);
    } catch (error) {
      reportDrop(error);
    }
  });
}

export async function track<Event extends EventDefinition>(
  { name, props: schema }: Event,
  props: z.input<Event["props"]>,
  { profileId, anonymous }: { profileId?: string; anonymous?: boolean } = {},
) {
  const [request, jar] = await Promise.all([headers(), cookies()]);
  const visitor = visitorOf(request, jar);
  if (visitor.optedOut) return;
  const referer = URL.parse(request.get("referer") ?? "");
  const page =
    referer?.host === request.get("host")
      ? { url: utmOnly(referer) }
      : undefined;
  const at = Date.now();
  after(async () => {
    try {
      const event = { name, props: schema.parse(props) };
      const who = anonymous ? { ...visitor, aid: undefined } : visitor;
      const context = { source: "server", at, profileId, page } as const;
      await deliver([trackedOf(who, event, context)], randomUUID());
    } catch (error) {
      reportDrop(error);
    }
  });
}

export function keepAid(response: NextResponse, visitor: Visitor) {
  if (visitor.aid && !visitor.optedOut)
    response.cookies.set(aidCookie, visitor.aid, cookieOptions);
}

export async function setAnalyticsConsent(on: boolean) {
  const store = await cookies();
  if (on) {
    store.delete(consentCookie);
    store.set(aidCookie, randomUUID(), cookieOptions);
  } else {
    store.set(consentCookie, "off", cookieOptions);
    store.delete(aidCookie);
  }
}
