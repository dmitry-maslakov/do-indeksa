import { describe, expect, it } from "vitest";
import {
  differentLayout,
  layoutSince,
  type Paper,
  placeNotes,
  topicsSeen,
} from "./exam-layout";

const places = ["a", "b", "c", "d"];

const papers: Paper[] = [
  { year: 2025, topics: ["a", "b", "c", "d"] },
  { year: 2021, topics: ["a", "x", "c", "d"] },
  { year: 2018, topics: ["a", "b", "d", "c"] },
  { year: 2017, topics: ["a", "b", "d", "c"] },
  { year: 2013, topics: ["a", "c", "b", "b"] },
  { year: 2012, topics: ["b", "a", "d", "c"] },
];

describe("exam layout", () => {
  it("marks papers where fewer than half the places match", () => {
    expect(papers.map((p) => differentLayout(p, places))).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
    ]);
  });

  it("starts the layout at the oldest year of the unbroken run", () => {
    expect(layoutSince(papers, places)).toBe(2017);
    expect(layoutSince([], places)).toBeUndefined();
  });

  it("notes the years a place held another topic since then", () => {
    expect(placeNotes(papers, places)).toEqual([
      [],
      [{ topic: "x", years: [2021] }],
      [{ topic: "d", years: [2017, 2018] }],
      [{ topic: "c", years: [2017, 2018] }],
    ]);
  });

  it("counts every topic the papers used", () => {
    expect(topicsSeen(papers)).toBe(5);
  });
});
