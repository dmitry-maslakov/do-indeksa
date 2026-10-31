import { describe, expect, it } from "vitest";
import { clientEvents, resultsShown } from "./bank-events";
import { recommendationOf } from "./queue/recommendation";

const schemaOf = (name: string) =>
  clientEvents.find((event) => event.name === name)?.props;

const picked = recommendationOf(
  "rail_upcoming",
  "complex-numbers",
  { id: "kb-003", repeat: true, reason: "repeatDue" },
  2,
);

describe("bank events", () => {
  it("accepts a recommendation built from a pick", () => {
    expect(schemaOf("recommendation_made")?.parse(picked)).toEqual({
      surface: "rail_upcoming",
      task_id: "kb-003",
      topic: "complex-numbers",
      algo_version: 3,
      repeat: true,
      reason: "repeatDue",
      slot: 2,
    });
  });

  it.each([
    ["no pick", undefined],
    ["a pick without a reason (the fallback start)", { id: "kb-003" }],
  ])("builds nothing from %s", (_, pick) => {
    expect(
      recommendationOf("bank_tab", "complex-numbers", pick),
    ).toBeUndefined();
  });

  it.each([
    ["an unknown task", { ...picked, task_id: "nema-001" }],
    ["an unknown surface", { ...picked, surface: "footer" }],
    ["another algorithm", { ...picked, algo_version: 2 }],
    ["an unknown reason", { ...picked, reason: "random" }],
    ["no reason", { ...picked, reason: undefined }],
  ])("rejects a recommendation with %s", (_, props) => {
    expect(schemaOf("recommendation_made")?.safeParse(props).success).toBe(
      false,
    );
  });

  it("records a search by its length and drops empty filters", () => {
    const shown = resultsShown(
      { q: "kvadratna", topic: "logarithms", level: null, number: 3 },
      0,
    );
    expect(schemaOf("bank_results_shown")?.parse(shown)).toEqual({
      topic: "logarithms",
      number: 3,
      q_len: 9,
      results: 0,
    });
  });

  it("leaves out filter values the catalog does not know", () => {
    const shown = resultsShown({ topic: "astrology", number: 12 }, 0);
    expect(schemaOf("bank_results_shown")?.parse(shown)).toEqual({
      results: 0,
    });
  });

  it.each([
    ["the query text", { q: "kvadratna", results: 1 }],
    ["an unknown topic", { topic: "astrology", results: 1 }],
    ["no result count", { level: "easy" }],
  ])("rejects bank results with %s", (_, props) => {
    expect(schemaOf("bank_results_shown")?.safeParse(props).success).toBe(
      false,
    );
  });
});
