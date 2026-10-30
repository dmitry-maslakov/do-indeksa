import { z } from "zod";
import { defineEvent, text } from "./analytics-schema";
import { routeTemplates } from "./routes";

const visitStarted = defineEvent("visit_started", {
  first_visit: z.boolean(),
  pointer: z.enum(["coarse", "fine", "none"]),
  viewport_w: z.int().min(0).max(20_000),
  dpr: z.number().positive(),
  effective_type: z.enum(["slow-2g", "2g", "3g", "4g"]).optional(),
  save_data: z.boolean().optional(),
  standalone: z.boolean(),
  tz: text,
  browser_lang: text,
});

const pageView = defineEvent("page_view", {
  path: text.startsWith("/"),
  nav: z.enum(["load", "reload", "push", "replace", "traverse"]),
  nav_ms: z.int().min(0).optional(),
  query_keys: z.array(text).max(20).optional(),
  tab: text.optional(),
  visible: z.boolean(),
  prev_route: z.enum([...routeTemplates, "/[...rest]"]).optional(),
});

const webVital = defineEvent("web_vital", {
  metric: z.enum(["CLS", "FCP", "INP", "LCP", "TTFB"]),
  value: z.number().min(0),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  nav_type: z.enum([
    "navigate",
    "reload",
    "back-forward",
    "back-forward-cache",
    "prerender",
    "restore",
  ]),
});

const errorShown = defineEvent("error_shown", {
  kind: z.enum(["route_error", "global_error", "not_found"]),
  path: text.startsWith("/"),
  digest: text.optional(),
});

const requestFailed = defineEvent("request_failed", {
  kind: z.enum([
    "feed",
    "reveal",
    "practice_action",
    "test_save",
    "test_finish",
  ]),
  reason: z.enum(["offline", "network", "http", "server"]),
  status: z.int().min(100).max(599).optional(),
});

const controlUsed = defineEvent("control_used", {
  control: z.enum([
    "topic_map_filter",
    "other_topic",
    "rail_sheet",
    "bank_filters_sheet",
    "bank_filters_reset",
    "stats_by",
    "theory_tab",
    "theory_section_link",
  ]),
  value: text.regex(/^[\w-]+$/).optional(),
});

const listPageLoaded = defineEvent("list_page_loaded", {
  list: z.enum(["bank", "tests"]),
  offset: z.int().min(1),
  items: z.int().min(0),
});

export const analyticsOptedIn = defineEvent("analytics_opted_in", {});

export const analyticsOptedOut = defineEvent("analytics_opted_out", {});

export const actionFailed = defineEvent("action_failed", {
  reason: z.enum(["unexpected", "bot"]),
  error: text.optional(),
});

export const clientEvents = [
  visitStarted,
  pageView,
  webVital,
  errorShown,
  requestFailed,
  controlUsed,
  listPageLoaded,
] as const;
