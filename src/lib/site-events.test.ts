import { describe, expect, it } from "vitest";
import { clientEvents } from "./site-events";

const schemaOf = (name: string) =>
  clientEvents.find((event) => event.name === name)?.props;

const valid = {
  visit_started: {
    first_visit: true,
    pointer: "coarse",
    viewport_w: 390,
    dpr: 3,
    effective_type: "4g",
    standalone: false,
    tz: "Europe/Belgrade",
    browser_lang: "sr-Latn-RS",
  },
  page_view: {
    path: "/ru/variants",
    nav: "push",
    nav_ms: 180,
    query_keys: ["tab", "utm_source"],
    tab: "weekly",
    visible: true,
    prev_route: "/bank/[id]",
  },
  web_vital: {
    metric: "LCP",
    value: 1840,
    rating: "good",
    nav_type: "navigate",
  },
  error_shown: { kind: "route_error", path: "/bank", digest: "1830472914" },
  request_failed: { kind: "reveal", reason: "server", status: 503 },
};

const invalid = {
  visit_started: { first_visit: "yes", pointer: "coarse" },
  page_view: { path: "/bank", nav: "load", visible: true, prev_route: "/x" },
  web_vital: {
    metric: "FID",
    value: 12,
    rating: "good",
    nav_type: "navigate",
  },
  error_shown: { kind: "crash", path: "/" },
  request_failed: { kind: "feed", reason: "offline", url: "/api/bank" },
};

describe("site events", () => {
  it.each(Object.entries(valid))("accepts %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(true);
  });

  it.each(Object.entries(invalid))("rejects a bad %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(false);
  });

  it("covers every client event", () => {
    expect(clientEvents.map(({ name }) => name).toSorted()).toEqual(
      Object.keys(valid).toSorted(),
    );
  });

  it("never uses OpenPanel's reserved keys", () => {
    const keys = clientEvents.flatMap(({ props }) => Object.keys(props.shape));
    expect(keys.filter((key) => key.startsWith("__"))).toEqual([]);
  });
});
