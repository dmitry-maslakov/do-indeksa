import { describe, expect, it } from "vitest";
import {
  bankHref,
  bankPageHref,
  loadBankFilters as load,
  pageAt,
  pageCount,
  pagedTopic,
  pageOf,
  pageOffset,
} from "./params";

const none = {
  q: null,
  number: null,
  topic: null,
  source: null,
  level: null,
  sort: null,
  status: null,
};

describe("bankParsers", () => {
  it("reads every filter", () => {
    expect(
      load(
        "?q=%20Jednačina%20&number=3&topic=logarithms&source=exam&level=easy&sort=hard&status=wrong",
      ),
    ).toEqual({
      q: "Jednačina",
      number: 3,
      topic: "logarithms",
      source: "exam",
      level: "easy",
      sort: "hard",
      status: "wrong",
    });
  });

  it("leaves absent filters empty", () => {
    expect(load("")).toEqual(none);
  });

  it("drops empty and unknown values", () => {
    expect(
      load(
        "?q=%20&number=-1&topic=&source=book&level=bogus&sort=up&status=favorite",
      ),
    ).toEqual(none);
    expect(load("?number=0")).toEqual(none);
    expect(load("?number=1.5")).toEqual(none);
    expect(load(`?q=${"a".repeat(101)}`)).toEqual(none);
  });

  it("takes the first of repeated keys", () => {
    expect(load("?level=easy&level=hard").level).toBe("easy");
  });
});

describe("bankHref", () => {
  it.each([
    [{}, "/bank"],
    [{ topic: null, level: null }, "/bank"],
    [{ q: "log", level: "easy" as const }, "/bank?q=log&level=easy"],
    [{ topic: "logarithms" }, "/bank/topic/logarithms"],
    [
      {
        topic: "logarithms",
        number: 3,
        source: "exam" as const,
        sort: "hard" as const,
      },
      "/bank/topic/logarithms?number=3&source=exam&sort=hard",
    ],
    [{ topic: "", status: "wrong" as const }, "/bank?status=wrong"],
  ])("links %o to %s", (filters, href) => {
    expect(bankHref(filters)).toBe(href);
  });
});

describe("pages of a topic", () => {
  it("continues each page where the feed loads the next one", () => {
    expect([2, 3, 4].map(pageOffset)).toEqual([3, 13, 23]);
    expect([3, 13, 23].map(pageAt)).toEqual([2, 3, 4]);
  });

  it("counts the first page and the pages after it", () => {
    expect([0, 3, 4, 13, 14, 131].map(pageCount)).toEqual([1, 1, 2, 2, 3, 14]);
  });

  it("reads only the canonical form of a page after the first", () => {
    expect(["2", "14"].map(pageOf)).toEqual([2, 14]);
    expect(["1", "0", "02", "2.0", "1e1", "-2", "", "dva"].map(pageOf)).toEqual(
      Array(8).fill(undefined),
    );
  });

  it("pages only a whole topic without other filters", () => {
    expect(pagedTopic({ topic: "logarithms" })).toBe("logarithms");
    expect(pagedTopic({ ...none, topic: "logarithms" })).toBe("logarithms");
    expect(pagedTopic({ topic: "logarithms", level: "easy" })).toBeUndefined();
    expect(pagedTopic({ q: "log" })).toBeUndefined();
    expect(bankPageHref("logarithms", 2)).toBe("/bank/topic/logarithms/2");
  });
});
