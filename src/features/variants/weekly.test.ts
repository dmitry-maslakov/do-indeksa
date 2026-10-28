import { describe, expect, it, vi } from "vitest";
import { curatedVariants } from "./variants";
import { weeklyVariant } from "./weekly";

vi.mock("content-collections", async (importOriginal) => {
  const content = await importOriginal<typeof import("content-collections")>();
  const base = content.allVariants.find((v) => v.kind === "official");
  const week = (id: string, released: boolean) => ({
    ...base,
    id,
    kind: "weekly",
    title: id,
    week: id.slice("nedelja-".length),
    released,
  });
  return {
    ...content,
    allVariants: [
      ...content.allVariants,
      week("nedelja-2026-10-26", true),
      week("nedelja-2026-11-02", false),
    ],
  };
});

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

  it("takes the variant written for the week", () => {
    expect(at("2026-11-04")).toMatchObject({
      id: "nedelja-2026-11-02",
      daysLeft: 5,
    });
    expect(at("2026-11-09")?.id).not.toBe("nedelja-2026-11-02");
  });

  it("lists a week among our tests once it is released", () => {
    const ids = curatedVariants.map((v) => v.id);
    expect(ids).toContain("nedelja-2026-10-26");
    expect(ids).not.toContain("nedelja-2026-11-02");
  });
});
