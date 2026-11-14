import { describe, expect, it } from "vitest";
import { currentAdmission, latestResults } from "./admissions";
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
});
