import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { insertEvents } from "@/server/clickhouse";
import { POST } from "./route";

const pending: Promise<unknown>[] = [];

vi.mock("next/server", async (original) => ({
  ...(await original()),
  after: (work: () => Promise<unknown>) => pending.push(work()),
}));
vi.mock("@/server/env", () => ({ env: {} }));
vi.mock("@/server/profile", () => ({
  existingProfileId: async () => "p1",
  noId: "0",
}));
vi.mock("@/server/clickhouse", () => ({ insertEvents: vi.fn() }));

const aid = "0b9f8a5e-5d47-4d1f-9a3e-1f2b3c4d5e6f";
const page = { path: "/bank", ago: 10 };
const events = [
  {
    name: "page_view",
    props: { path: "/bank", nav: "load", visible: true },
    ...page,
  },
  {
    name: "page_view",
    props: { path: "/bank", nav: "fly", visible: true },
    ...page,
  },
];
const body = JSON.stringify({
  id: "6f1d3c1e-2a51-4c36-9a5e-3b1e0e6b4b8a",
  events,
});

const post = (headers: Record<string, string> = {}, text = body) =>
  POST(
    new NextRequest("https://doindeksa.rs/api/events", {
      method: "POST",
      body: text,
      headers: {
        host: "doindeksa.rs",
        origin: "https://doindeksa.rs",
        "sec-fetch-site": "same-origin",
        "content-type": "application/json",
        "content-length": String(text.length),
        cookie: `aid=${aid}`,
        ...headers,
      },
    }),
  );

describe("POST /api/events", () => {
  beforeEach(() => {
    pending.length = 0;
    vi.mocked(insertEvents).mockReset();
  });

  it("records the valid events and refreshes the aid cookie", async () => {
    const response = await post();
    await Promise.all(pending);
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toMatch(
      new RegExp(`^aid=${aid}; Path=/; .*Max-Age=34560000`),
    );
    const [rows] = vi.mocked(insertEvents).mock.calls[0] ?? [];
    expect(rows).toHaveLength(1);
  });

  it("records nothing for a visitor who opted out", async () => {
    const response = await post({ cookie: `aid=${aid}; analytics=off` });
    await Promise.all(pending);
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(insertEvents).not.toHaveBeenCalled();
  });

  it.each([
    ["a body that is not JSON", { "content-type": "text/plain" }, 415],
    ["an oversized body", { "content-length": String(33 * 1024) }, 413],
    ["a cross-site request", { "sec-fetch-site": "cross-site" }, 403],
    ["another origin", { origin: "https://evil.test" }, 403],
    ["no origin", { origin: "" }, 403],
  ])("refuses %s", async (_, headers, status) => {
    expect((await post(headers)).status).toBe(status);
  });

  it("allows a browser that sends no Sec-Fetch-Site", async () => {
    expect((await post({ "sec-fetch-site": "" })).status).toBe(204);
  });

  it("refuses a body without a length", async () => {
    const request = new NextRequest("https://doindeksa.rs/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(411);
  });

  it("refuses a broken batch", async () => {
    expect((await post({}, "{")).status).toBe(400);
  });
});
