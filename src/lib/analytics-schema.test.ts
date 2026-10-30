import { describe, expect, it } from "vitest";
import { z } from "zod";
import { batchParser, defineEvent, text } from "./analytics-schema";

const parse = batchParser([
  defineEvent("page_view", { path: text }),
  defineEvent("web_vital", { metric: z.enum(["LCP"]), value: z.number() }),
]);

const id = "6f1d3c1e-2a51-4c36-9a5e-3b1e0e6b4b8a";
const pageView = { name: "page_view", props: { path: "/bank" } };
const page = { path: "/bank?utm_source=ig", ago: 120 };
const body = (events: unknown[], batch = id) =>
  JSON.stringify({ id: batch, events });

describe("batchParser", () => {
  it("keeps valid events with their page", () => {
    expect(
      parse(body([{ ...pageView, ...page, referrer: "https://google.com" }])),
    ).toEqual({
      id,
      events: [{ ...pageView, ...page, referrer: "https://google.com" }],
    });
  });

  it.each([
    ["an unknown name", { ...page, name: "task_opened", props: {} }],
    ["an extra prop", { ...page, ...pageView, props: { path: "/", q: "x" } }],
    [
      "a wrong type",
      { ...page, name: "web_vital", props: { metric: "FID", value: 1 } },
    ],
    ["a host-relative path", { ...pageView, path: "//evil.test/", ago: 0 }],
    ["a negative age", { ...pageView, path: "/", ago: -1 }],
    ["no page", pageView],
  ])("drops only an event with %s", (_, bad) => {
    expect(parse(body([bad, { ...pageView, ...page }]))?.events).toEqual([
      { ...pageView, ...page },
    ]);
  });

  it("cuts long text to 200 characters", () => {
    const long = {
      ...page,
      name: "page_view",
      props: { path: "x".repeat(300) },
    };
    expect(parse(body([long]))?.events[0]?.props).toEqual({
      path: "x".repeat(200),
    });
  });

  it.each([
    ["broken JSON", "{"],
    ["a batch without events", body([])],
    ["a batch id that is not a uuid", body([{ ...pageView, ...page }], "1")],
    ["more than 50 events", body(Array(51).fill({ ...pageView, ...page }))],
  ])("refuses %s", (_, text) => {
    expect(parse(text)).toBeUndefined();
  });
});
