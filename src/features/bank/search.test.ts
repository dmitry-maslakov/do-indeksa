import { describe, expect, it } from "vitest";
import { filterByStatus, searchBank } from "./search";

const rank = (t: { number: number | null }) =>
  t.number ?? Number.MAX_SAFE_INTEGER;

const ids = (filters: Parameters<typeof searchBank>[0]) =>
  searchBank(filters).map((t) => t.id);

describe("searchBank", () => {
  it("lists every task by number, tasks outside the exam last", () => {
    const found = searchBank({});
    expect(found.length).toBeGreaterThan(0);
    expect(found.map(rank)).toEqual(found.map(rank).sort((a, b) => a - b));
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

  it("filters by source", () => {
    const exam = ids({ source: "exam" });
    const ours = ids({ source: "ours" });
    expect(exam.length + ours.length).toBe(ids({}).length);
    expect(exam.filter((id) => ours.includes(id))).toEqual([]);
  });

  it("searches the source", () => {
    expect(ids({ q: "do indeksa" })).toEqual(ids({ source: "ours" }));
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
        (a, b) => a.difficulty - b.difficulty || rank(a) - rank(b),
      ),
    );
  });

  it("sorts hard first by difficulty, then by number", () => {
    const found = searchBank({ sort: "hard" });
    expect(found).toEqual(
      [...found].sort(
        (a, b) => b.difficulty - a.difficulty || rank(a) - rank(b),
      ),
    );
  });

  it("returns the same tasks in every order", () => {
    const sorted = (sort?: "easy" | "hard") => ids({ sort }).sort();
    expect(sorted("easy")).toEqual(sorted());
    expect(sorted("hard")).toEqual(sorted());
  });
});

describe("filterByStatus", () => {
  const found = searchBank({});
  const [first] = found.map((t) => t.id);
  const statuses = new Map([[String(first), "solved" as const]]);
  const idsBy = (status: Parameters<typeof filterByStatus>[1]) =>
    filterByStatus(found, status, statuses).map((t) => t.id);

  it("keeps tasks with the status", () => {
    expect(idsBy("solved")).toEqual([first]);
    expect(idsBy("new")).not.toContain(first);
  });

  it("ignores the status without statuses", () => {
    expect(filterByStatus(found, "solved")).toBe(found);
    expect(filterByStatus(found, null, statuses)).toBe(found);
  });
});
