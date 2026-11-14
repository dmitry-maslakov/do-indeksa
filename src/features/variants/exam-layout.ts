import { groupBy, sortBy, takeWhile } from "es-toolkit";

export interface Paper {
  year: number;
  topics: string[];
}

const matching = (paper: Paper, places: string[]) =>
  places.filter((topic, i) => paper.topics[i] === topic).length;

export const differentLayout = (paper: Paper, places: string[]) =>
  matching(paper, places) * 2 < places.length;

export function layoutSince(papers: Paper[], places: string[]) {
  const newestFirst = sortBy(papers, [(p) => -p.year]);
  return takeWhile(newestFirst, (p) => !differentLayout(p, places)).at(-1)
    ?.year;
}

export function placeNotes(papers: Paper[], places: string[]) {
  const since = layoutSince(papers, places) ?? Number.POSITIVE_INFINITY;
  const recent = sortBy(
    papers.filter((p) => p.year >= since),
    ["year"],
  );
  return places.map((topic, i) =>
    Object.entries(
      groupBy(
        recent.filter((p) => p.topics[i] !== topic),
        (p) => p.topics[i] ?? "",
      ),
    ).map(([moved, list]) => ({
      topic: moved,
      years: list.map((p) => p.year),
    })),
  );
}

export const topicsSeen = (papers: Paper[]) =>
  new Set(papers.flatMap((p) => p.topics)).size;
