import { describe, expect, it } from "vitest";
import { searchBank } from "./bank";

const ids = (
  filters: Parameters<typeof searchBank>[0],
  progress?: Parameters<typeof searchBank>[1],
) => searchBank(filters, progress).map((t) => t.id);

describe("searchBank", () => {
  it("lists every task by number", () => {
    const numbers = searchBank({}).map((t) => t.number);
    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  it("searches without diacritics", () => {
    expect(ids({ q: "JEDNACINU" })).toEqual(ids({ q: "jednačinu" }));
    expect(ids({ q: "jednacinu" }).length).toBeGreaterThan(0);
    expect(ids({ q: "nema-takve-reci" })).toEqual([]);
  });

  it("filters by topic, number and level", () => {
    expect(
      searchBank({ topic: "logarithms" }).every(
        (t) => t.topic === "logarithms",
      ),
    ).toBe(true);
    expect(searchBank({ number: 3 }).every((t) => t.number === 3)).toBe(true);
    expect(searchBank({ level: "easy" }).every((t) => t.level === "easy")).toBe(
      true,
    );
  });

  it("combines the text search with the other filters", () => {
    const found = searchBank({ q: "jednacinu", level: "easy", sort: "hard" });
    const all = searchBank({ q: "jednacinu", sort: "hard" });
    expect(found.length).toBeGreaterThan(0);
    expect(found).toEqual(all.filter((t) => t.level === "easy"));
  });

  it("sorts easy first by difficulty, then by number", () => {
    const found = searchBank({ sort: "easy" });
    expect(found).toEqual(
      [...found].sort(
        (a, b) => a.difficulty - b.difficulty || a.number - b.number,
      ),
    );
  });

  it("sorts hard first by difficulty, then by number", () => {
    const found = searchBank({ sort: "hard" });
    expect(found).toEqual(
      [...found].sort(
        (a, b) => b.difficulty - a.difficulty || a.number - b.number,
      ),
    );
  });

  it("returns the same tasks in every order", () => {
    const sorted = (sort?: "easy" | "hard") => ids({ sort }).sort();
    expect(sorted("easy")).toEqual(sorted());
    expect(sorted("hard")).toEqual(sorted());
  });

  it("filters by status and favorites", () => {
    const [first, second] = ids({});
    const progress = {
      statuses: new Map([[String(first), "solved" as const]]),
      favorites: new Set([String(second)]),
    };
    expect(ids({ status: "solved" }, progress)).toEqual([first]);
    expect(ids({ status: "favorite" }, progress)).toEqual([second]);
    expect(ids({ status: "new" }, progress)).not.toContain(first);
    expect(ids({ status: "solved" })).toEqual(ids({}));
  });
});
