import { sortBy } from "es-toolkit";
import "server-only";
import { allMethods, allTheories } from "content-collections";
import { numberOf } from "@/features/catalog/exams";

export const theories = sortBy(allTheories, [
  (t) => numberOf(t.topic) ?? Number.POSITIVE_INFINITY,
]);

export const getTheory = (topic: string) =>
  allTheories.find((t) => t.topic === topic);

export const theoryMethods = sortBy(allMethods, ["order"]);

const methodsByTopic = Map.groupBy(theoryMethods, (m) => m.topic);

export const methodsOf = (topic: string) => methodsByTopic.get(topic) ?? [];

export const getMethod = (topic: string, slug: string) =>
  methodsOf(topic).find((m) => m.slug === slug);
