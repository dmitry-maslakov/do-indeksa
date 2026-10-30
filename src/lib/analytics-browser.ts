import { attempt, noop, round } from "es-toolkit";
import type { EventMap } from "./analytics-schema";
import { daySeconds, secondMs } from "./dates";
import { type RouteTemplate, routeOf } from "./routes";
import type { clientEvents } from "./site-events";

export const aidCookie = "aid";
export const consentCookie = "analytics";
export const analyticsCookieAge = 400 * daySeconds;
export const batchBytes = 32 * 1024;

export interface BrowserEvents extends EventMap<typeof clientEvents> {}

type Name = keyof BrowserEvents;
type Navigation = BrowserEvents["page_view"]["nav"];
type Vital = BrowserEvents["web_vital"];
type ErrorKind = BrowserEvents["error_shown"]["kind"];

interface Queued {
  name: Name;
  props: BrowserEvents[Name];
  path: string;
  referrer?: string;
  at: number;
}

export interface Intent {
  via: string;
  placement?: string;
  rank?: number;
}

interface BrowserExtras {
  globalPrivacyControl?: boolean;
  connection?: {
    effectiveType?: BrowserEvents["visit_started"]["effective_type"];
    saveData?: boolean;
  };
}

const batchSize = 10;
const flushMs = 5 * secondMs;
const flushBytes = batchBytes / 2;
const visitKey = "visit";
const browser = () => navigator as Navigator & BrowserExtras;
const historyIntent: Intent = { via: "history" };

let queue: Queued[] = [];
let queuedBytes = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let loadPath = "/";
let pageViews = 0;
let lastRoute: RouteTemplate | undefined;
let transition: { nav: Navigation; at: number } | undefined;
let pendingIntent: Intent | undefined;
let intent: Intent | undefined;

const readCookie = (name: string) =>
  document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];

const isUtm = (key: string) => key.startsWith("utm_");

export function utmOnly(url: URL) {
  for (const key of [...url.searchParams.keys()])
    if (!isUtm(key)) url.searchParams.delete(key);
  return url;
}

function currentPath() {
  const { pathname, search } = utmOnly(new URL(location.href));
  return pathname + search;
}

function dropUtm() {
  const url = new URL(location.href);
  const utm = [...url.searchParams.keys()].filter(isUtm);
  for (const key of utm) url.searchParams.delete(key);
  if (utm.length) history.replaceState(null, "", url);
}

export function analyticsConsent() {
  if (browser().globalPrivacyControl) return "gpc";
  return readCookie(consentCookie) === "off" ? "off" : "on";
}

export function flush() {
  clearTimeout(timer);
  timer = undefined;
  if (!queue.length) return Promise.resolve();
  const now = Date.now();
  const events = queue.map(({ at, ...event }) => ({
    ...event,
    ago: Math.max(0, now - at),
  }));
  queue = [];
  queuedBytes = 0;
  return fetch("/api/events", {
    method: "POST",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: crypto.randomUUID(), events }),
  }).then(noop, noop);
}

function enqueue<Event extends Name>(
  name: Event,
  props: BrowserEvents[Event],
  path = currentPath(),
  referrer?: string,
) {
  if (analyticsConsent() !== "on") return;
  const item = { name, props, path, referrer, at: Date.now() };
  const bytes = JSON.stringify(item).length;
  if (queuedBytes + bytes > flushBytes) flush();
  queue.push(item);
  queuedBytes += bytes;
  if (queue.length >= batchSize || document.visibilityState === "hidden")
    flush();
  else timer ??= setTimeout(flush, flushMs);
}

export const queueEvent = <Event extends Name>(
  name: Event,
  props: BrowserEvents[Event],
  path?: string,
) => enqueue(name, props, path);

function crossReferrer() {
  const [, url] = attempt(() => new URL(document.referrer));
  return url && url.host !== location.host ? url.origin : undefined;
}

function startVisit() {
  const firstVisit = !readCookie(aidCookie);
  if (firstVisit)
    document.cookie = `${aidCookie}=${crypto.randomUUID()}; Max-Age=${analyticsCookieAge}; Path=/; SameSite=Lax; Secure`;
  if (attempt(() => sessionStorage.getItem(visitKey))[1]) return;
  attempt(() => sessionStorage.setItem(visitKey, "1"));
  const { connection, language } = browser();
  const pointer = (["coarse", "fine"] as const).find(
    (kind) => matchMedia(`(pointer: ${kind})`).matches,
  );
  enqueue(
    "visit_started",
    {
      first_visit: firstVisit,
      pointer: pointer ?? "none",
      viewport_w: innerWidth,
      dpr: round(devicePixelRatio, 2),
      effective_type: connection?.effectiveType,
      save_data: connection?.saveData,
      standalone: matchMedia("(display-mode: standalone)").matches,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browser_lang: language,
    },
    loadPath,
    crossReferrer(),
  );
}

export const intentOf = (intent: Intent) => JSON.stringify(intent);

export const rememberIntent = (value: Intent) => {
  pendingIntent = value;
};

export function takeIntent() {
  const taken = intent;
  intent = undefined;
  return taken;
}

function clicked(event: MouseEvent) {
  if (event.button || event.metaKey || event.ctrlKey || event.shiftKey) return;
  const value = (event.target as Element)
    .closest?.("[data-intent]")
    ?.getAttribute("data-intent");
  pendingIntent = value ? attempt(() => JSON.parse(value))[1] : undefined;
}

export function startAnalytics() {
  loadPath = currentPath();
  intent = loadNavigation() === "load" ? undefined : historyIntent;
  addEventListener("click", clicked, true);
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  if (analyticsConsent() === "on") startVisit();
  else document.cookie = `${aidCookie}=; Max-Age=0; Path=/`;
}

export function navigationStarted(nav: Navigation) {
  transition = { nav, at: performance.now() };
  intent = nav === "traverse" ? historyIntent : pendingIntent;
  pendingIntent = undefined;
}

function loadNavigation(): Navigation {
  const [entry] = performance.getEntriesByType("navigation");
  const type = entry && (entry as PerformanceNavigationTiming).type;
  if (type === "reload") return "reload";
  return type === "back_forward" ? "traverse" : "load";
}

export function viewPage(pathname: string) {
  const first = pageViews++ === 0;
  const params = new URLSearchParams(location.search);
  const queryKeys = [...new Set(params.keys())];
  queueEvent("page_view", {
    path: pathname,
    nav: first ? loadNavigation() : (transition?.nav ?? "push"),
    nav_ms:
      first || !transition
        ? undefined
        : Math.round(performance.now() - transition.at),
    query_keys: queryKeys.length ? queryKeys.slice(0, 20) : undefined,
    tab:
      params.get("tab") ??
      params.get("by") ??
      params.get("fallback") ??
      undefined,
    visible: document.visibilityState === "visible",
    prev_route: lastRoute,
  });
  lastRoute = routeOf(pathname).route;
  transition = undefined;
  if (!first) return;
  flush();
  dropUtm();
}

export const recordError = (kind: ErrorKind, digest?: string) =>
  queueEvent("error_shown", { kind, path: location.pathname, digest });

export function reportVital(metric: {
  name: Vital["metric"] | "FID";
  value: number;
  rating: Vital["rating"];
  navigationType: Vital["nav_type"];
}) {
  if (metric.name === "FID") return;
  enqueue(
    "web_vital",
    {
      metric: metric.name,
      value:
        metric.name === "CLS"
          ? round(metric.value, 4)
          : Math.round(metric.value),
      rating: metric.rating,
      nav_type: metric.navigationType,
    },
    loadPath,
  );
}
