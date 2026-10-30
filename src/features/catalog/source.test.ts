import { describe, expect, it } from "vitest";
import { examSource } from "./source";

describe("examSource", () => {
  it("reads the exam year and position", () => {
    expect(examSource("FTN prijemni 2025, zadatak 9")).toEqual({
      year: 2025,
      position: 9,
    });
  });

  it("leaves authored tasks without an exam", () => {
    expect(examSource("Do indeksa")).toBeNull();
  });
});
