import { describe, expect, it } from "vitest";
import { loadBankFilters as load } from "./params";

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
