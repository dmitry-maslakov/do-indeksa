import { describe, expect, it } from "vitest";
import { weeklyVariant } from "./weekly";

const at = (day: string) => weeklyVariant(new Date(`${day}T10:00:00Z`));

describe("weeklyVariant", () => {
  it("keeps one variant from Monday to Sunday", () => {
    const monday = at("2026-10-19");
    expect(monday?.daysLeft).toBe(7);
    expect(at("2026-10-25")).toMatchObject({ id: monday?.id, daysLeft: 1 });
  });

  it("describes the variant", () => {
    expect(at("2026-10-19")).toMatchObject({ tasks: 10, hours: 4, points: 60 });
    expect(at("2026-10-19")?.topics).toHaveLength(10);
  });
});
