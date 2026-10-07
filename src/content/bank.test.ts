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

  it("sorts by difficulty", () => {
    const hard = searchBank({ sort: "hard" }).map((t) => t.difficulty);
    expect(hard).toEqual([...hard].sort((a, b) => b - a));
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
