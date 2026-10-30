import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rowOf, trackBatch, visitorOf } from "./analytics";
import { insertEvents } from "./clickhouse";
import { sendToOpenPanel } from "./openpanel";
import { existingProfileId } from "./profile";

const pending: Promise<unknown>[] = [];

vi.mock("next/server", async (original) => ({
  ...(await original()),
  after: (work: () => Promise<unknown>) => pending.push(work()),
}));
vi.mock("./clickhouse", () => ({ insertEvents: vi.fn() }));
vi.mock("./openpanel", () => ({ sendToOpenPanel: vi.fn() }));
vi.mock("./profile", () => ({ existingProfileId: vi.fn(), noId: "0" }));

const aid = "0b9f8a5e-5d47-4d1f-9a3e-1f2b3c4d5e6f";
const iphone =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const googlebot =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const visitor = (
  headers: Record<string, string> = {},
  cookie = `aid=${aid}`,
) => {
  const request = new NextRequest("https://doindeksa.rs/api/events", {
    headers: { "user-agent": iphone, "cf-ipcountry": "RS", cookie, ...headers },
  });
  return visitorOf(request.headers, request.cookies);
};

const pageView = { name: "page_view", props: { path: "/ru/bank/eks-001" } };

describe("visitorOf", () => {
  it("reads the aid, country and device", () => {
    expect(visitor()).toMatchObject({
      aid,
      optedOut: false,
      country: "RS",
      device: "mobile",
      os: "iOS",
      browser: "Mobile Safari",
      bot: false,
    });
  });

  it("ignores an aid that is not a uuid", () => {
    expect(visitor({}, "aid=x").aid).toBeUndefined();
  });

  it.each([
    ["the opt-out cookie", {}, `aid=${aid}; analytics=off`],
    ["Global Privacy Control", { "sec-gpc": "1" }, `aid=${aid}`],
  ])("is opted out by %s", (_, headers, cookie) => {
    expect(visitor(headers, cookie).optedOut).toBe(true);
  });

  it.each([
    ["a crawler", googlebot],
    ["a request without a user agent", ""],
  ])("marks %s as a bot", (_, userAgent) => {
    expect(visitor({ "user-agent": userAgent }).bot).toBe(true);
  });
});

describe("rowOf", () => {
  const at = Date.parse("2026-10-30T10:00:00.000Z");
  const page = {
    url: new URL(
      "https://doindeksa.rs/ru/bank/eks-001?utm_source=ig&utm_campaign=jun",
    ),
    referrer: new URL("https://www.google.com"),
  };

  it("builds exactly the columns of the events table", () => {
    const row = rowOf(visitor(), pageView, {
      source: "browser",
      at,
      profileId: "p1",
      page,
    });
    expect(Object.keys(row).toSorted()).toEqual(
      [
        "event_id",
        "ts",
        "name",
        "source",
        "profile_id",
        "aid",
        "route",
        "locale",
        "device",
        "os",
        "browser",
        "country",
        "referrer_domain",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
        "release",
        "bot",
        "props",
      ].toSorted(),
    );
    expect(row).toMatchObject({
      ts: "2026-10-30T10:00:00.000Z",
      name: "page_view",
      source: "browser",
      profile_id: "p1",
      aid,
      route: "/bank/[id]",
      locale: "ru",
      device: "mobile",
      country: "RS",
      referrer_domain: "www.google.com",
      utm_source: "ig",
      utm_campaign: "jun",
      utm_medium: "",
      bot: false,
      props: pageView.props,
    });
  });

  it("fills missing ids and the page of a server event with blanks", () => {
    expect(
      rowOf(visitor({}, ""), pageView, { source: "server", at }),
    ).toMatchObject({ aid: "0", profile_id: "0", route: "", locale: "" });
  });
});

describe("trackBatch", () => {
  beforeEach(() => {
    pending.length = 0;
    vi.mocked(insertEvents).mockReset();
    vi.mocked(existingProfileId).mockResolvedValue("p1");
  });

  const batch = {
    id: "b1",
    events: [
      {
        ...pageView,
        path: "/bank?q=x&utm_term=a",
        referrer: "https://www.google.com/search?q=x",
        ago: 1000,
      },
    ],
  };

  it("sends the batch with a token for deduplication", async () => {
    trackBatch(visitor(), batch);
    await Promise.all(pending);
    const [rows, token] = vi.mocked(insertEvents).mock.calls[0] ?? [];
    expect(token).toBe(`${aid}:b1`);
    expect(rows?.[0]).toMatchObject({ profile_id: "p1", utm_term: "a" });
    const [sent] = vi.mocked(sendToOpenPanel).mock.calls[0]?.[0] ?? [];
    expect(sent?.page?.url.href).toBe("https://doindeksa.rs/bank?utm_term=a");
  });

  it("sends nothing for a visitor who opted out", async () => {
    trackBatch(visitor({ "sec-gpc": "1" }), batch);
    await Promise.all(pending);
    expect(pending).toEqual([]);
    expect(insertEvents).not.toHaveBeenCalled();
  });
});
