import { describe, expect, it } from "vitest";
import { clientEvents } from "./bank-events";
import { recommendationOf } from "./queue/recommendation";

const schemaOf = (name: string) =>
  clientEvents.find((event) => event.name === name)?.props;

const picked = recommendationOf(
  "rail_upcoming",
  "complex-numbers",
  { id: "kb-003", repeat: true },
  2,
);

describe("bank events", () => {
  it("accepts a recommendation built from a pick", () => {
    expect(schemaOf("recommendation_made")?.parse(picked)).toEqual({
      surface: "rail_upcoming",
      task_id: "kb-003",
      topic: "complex-numbers",
      algo_version: 1,
      repeat: true,
      slot: 2,
    });
  });

  it.each([
    ["no pick", undefined],
    ["a fallback start", { id: "kb-003", fallback: true }],
  ])("builds nothing from %s", (_, pick) => {
    expect(
      recommendationOf("bank_tab", "complex-numbers", pick),
    ).toBeUndefined();
  });

  it.each([
    ["an unknown task", { ...picked, task_id: "nema-001" }],
    ["an unknown surface", { ...picked, surface: "footer" }],
    ["another algorithm", { ...picked, algo_version: 2 }],
  ])("rejects a recommendation with %s", (_, props) => {
    expect(schemaOf("recommendation_made")?.safeParse(props).success).toBe(
      false,
    );
  });
});
