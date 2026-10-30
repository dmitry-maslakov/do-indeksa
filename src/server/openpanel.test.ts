import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Tracked } from "./analytics";
import { identifyOf, sendToOpenPanel, toOpenPanel } from "./openpanel";

vi.mock("./env", () => ({
  env: {
    OPENPANEL_API_URL: "http://openpanel.test:3000",
    OPENPANEL_CLIENT_ID: "client",
    OPENPANEL_CLIENT_SECRET: "secret",
  },
}));

const aid = "0b9f8a5e-5d47-4d1f-9a3e-1f2b3c4d5e6f";

const tracked = (context: Partial<Tracked> = {}): Tracked => ({
  source: "browser",
  at: 0,
  row: {
    event_id: "5c0a4e43-8f61-4f0e-9a38-34b1f0d3a1c2",
    ts: "2026-10-30T10:00:00.000Z",
    name: "page_view",
    source: "browser",
    profile_id: "00000000-0000-0000-0000-000000000000",
    aid,
    route: "/bank/[id]",
    locale: "ru",
    device: "mobile",
    os: "iOS",
    browser: "Safari",
    country: "RS",
    referrer_domain: "www.google.com",
    utm_source: "ig",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    release: "abc",
    bot: false,
    props: { path: "/ru/bank/eks-001", query_keys: ["topic", "level"] },
  },
  page: {
    url: new URL("https://doindeksa.rs/ru/bank/eks-001?utm_source=ig"),
    referrer: new URL("https://www.google.com"),
  },
  visitor: {
    aid,
    optedOut: false,
    userAgent: "Mozilla/5.0 Safari",
    device: "mobile",
    os: "iOS",
    browser: "Safari",
    bot: false,
    ip: "203.0.113.7",
    country: "RS",
  },
  ...context,
});

describe("toOpenPanel", () => {
  it("sends a page view as screen_view keyed by the aid", () => {
    const { payload } = toOpenPanel(tracked());
    expect(payload).toEqual({
      name: "screen_view",
      profileId: aid,
      properties: {
        path: "/ru/bank/eks-001",
        query_keys: "topic,level",
        route: "/bank/[id]",
        locale: "ru",
        source: "browser",
        __path: "https://doindeksa.rs/ru/bank/eks-001?utm_source=ig",
        __referrer: "https://www.google.com",
        __timestamp: "2026-10-30T10:00:00.000Z",
      },
    });
    expect(payload.properties).not.toHaveProperty("__deviceId");
  });

  it("prefers the profile id", () => {
    expect(toOpenPanel(tracked({ profileId: "p1" })).payload.profileId).toBe(
      "p1",
    );
  });

  it("points an event without a page at the site", () => {
    const { properties } = toOpenPanel(tracked({ page: undefined })).payload;
    expect(properties.__path).toBe("https://doindeksa.rs/");
    expect(properties.__referrer).toBeUndefined();
  });

  it("keeps profile ids out of the properties", () => {
    const merged = tracked();
    merged.row.props = {
      outcome: "merged",
      from_profile_id: "p0",
      to_profile_id: "p1",
      task_id: "eks-001",
    };
    const { properties } = toOpenPanel(merged).payload;
    expect(properties).toMatchObject({ outcome: "merged", task_id: "eks-001" });
    expect(properties).not.toHaveProperty("from_profile_id");
    expect(properties).not.toHaveProperty("to_profile_id");
  });
});

describe("identifyOf", () => {
  const event = (name: string, props: Record<string, unknown>) => {
    const item = tracked({ profileId: "p1", source: "server" });
    item.row.name = name;
    item.row.props = props;
    return item;
  };

  it("names the kind of a new profile", () => {
    expect(identifyOf(event("profile_created", { kind: "guest" }))).toEqual({
      type: "identify",
      payload: { profileId: "p1", properties: { kind: "guest" } },
    });
  });

  it("marks a signed-in profile as an account", () => {
    expect(
      identifyOf(event("signed_in", { method: "google" }))?.payload.properties,
    ).toEqual({ kind: "account" });
  });

  it("identifies nobody for other events or without a profile", () => {
    const anonymous = event("profile_created", { kind: "guest" });
    anonymous.profileId = undefined;
    expect(identifyOf(event("page_view", {}))).toBeUndefined();
    expect(identifyOf(anonymous)).toBeUndefined();
  });
});

describe("sendToOpenPanel", () => {
  const fetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetch);
    fetch.mockResolvedValue(new Response(null, { status: 202 }));
  });

  afterEach(() => {
    fetch.mockReset();
    vi.unstubAllGlobals();
  });

  const headersOf = (call = 0) =>
    fetch.mock.calls[call]?.[1].headers as Record<string, string>;

  it("forwards the browser and its address for browser events", async () => {
    await sendToOpenPanel([tracked()]);
    expect(fetch.mock.calls[0]?.[0].href).toBe(
      "http://openpanel.test:3000/track",
    );
    expect(headersOf()).toMatchObject({
      "openpanel-client-id": "client",
      "openpanel-client-secret": "secret",
      "openpanel-sdk-version": "abc",
      "user-agent": "Mozilla/5.0 Safari",
      "openpanel-client-ip": "203.0.113.7",
    });
  });

  it("sends server events as the server", async () => {
    await sendToOpenPanel([tracked({ source: "server" })]);
    expect(headersOf()["user-agent"]).toBe("do-indeksa/1");
    expect(headersOf()).not.toHaveProperty("openpanel-client-ip");
  });

  it("identifies the profile before its event", async () => {
    const created = tracked({ profileId: "p1", source: "server" });
    created.row.name = "profile_created";
    created.row.props = { kind: "account" };
    await sendToOpenPanel([created]);
    const types = fetch.mock.calls.map(
      ([, init]) => JSON.parse(init.body).type,
    );
    expect(types).toEqual(["identify", "track"]);
  });

  it("leaves bots out", async () => {
    const bot = tracked();
    bot.row.bot = true;
    await sendToOpenPanel([bot]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries once after a server error", async () => {
    fetch.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(sendToOpenPanel([tracked()])).rejects.toThrow("503");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("sends the rest of the batch after a refused event", async () => {
    fetch.mockResolvedValueOnce(new Response(null, { status: 400 }));
    await expect(sendToOpenPanel([tracked(), tracked()])).rejects.toThrow(
      "400",
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
