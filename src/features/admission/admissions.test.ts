import { describe, expect, it } from "vitest";
import {
  currentAdmission,
  latestResults,
  programHistory,
  resultYears,
  ruleGroups,
  runs,
} from "./admissions";
import { facultyPrograms } from "./programs";
import { resolveRefs } from "./sources";

describe("admissions", () => {
  it("takes the newest year and the newest year with results", () => {
    expect(currentAdmission("ftn").year).toBe(2026);
    expect(latestResults("ftn")?.year).toBe(2025);
  });

  it("orders programmes by the Serbian alphabet", () => {
    expect(facultyPrograms("ftn").map((p) => p.slug)).toEqual([
      "geodezija",
      "ra",
      "siit",
    ]);
  });

  it("resolves a konkurs section and a faculty link", () => {
    expect(
      resolveRefs("ftn", [{ cycle: 2026, section: "1" }, { link: "faq" }]),
    ).toEqual([
      {
        kind: "cycle",
        year: 2026,
        section: "1",
        url: "https://example.com/konkurs.pdf",
      },
      { kind: "link", title: "Pitanja", url: "https://example.com/" },
    ]);
  });

  it("groups equal consecutive values into runs", () => {
    expect(
      runs([
        { year: 2026, value: 140 },
        { year: 2025, value: 140 },
        { year: 2024, value: 120 },
        { year: 2023, value: 140 },
      ]),
    ).toEqual([
      { value: 140, years: [2026, 2025] },
      { value: 120, years: [2024] },
      { value: 140, years: [2023] },
    ]);
  });

  it("collects a programme's rows newest first", () => {
    const history = programHistory("ftn", "ra");
    expect(history.map((y) => [y.year, y.tuition])).toEqual([
      [2026, 100000],
      [2025, 90000],
    ]);
    expect(resultYears(history).map((y) => [y.year, y.cutoff])).toEqual([
      [2025, { budget: 70, self: null }],
    ]);
    expect(resultYears(programHistory("ftn", "nema-smera"))).toEqual([]);
  });

  it("groups the years by their thresholds", () => {
    expect(ruleGroups("ftn").map((g) => g.years)).toEqual([[2026], [2025]]);
  });
});
