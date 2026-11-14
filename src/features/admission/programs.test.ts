import { describe, expect, it } from "vitest";
import {
  checkedPrograms,
  getProgram,
  moduleKindOf,
  neighbours,
  programExam,
} from "./programs";

describe("programs", () => {
  it("gives a page only to a checked programme", () => {
    expect(checkedPrograms.map((p) => p.slug)).toEqual(["ra", "siit"]);
    expect(getProgram("ftn", "ra")?.name).toBe("Računarstvo i automatika");
    expect(getProgram("ftn", "geodezija")).toBeUndefined();
    expect(getProgram("ftn", "nema-smera")).toBeUndefined();
  });

  it("lists the programmes on the same exam without the programme", () => {
    const ra = getProgram("ftn", "ra");
    expect(
      ra && neighbours(ra).map(({ slug, linked }) => ({ slug, linked })),
    ).toEqual([{ slug: "siit", linked: true }]);
    expect(ra && programExam(ra).id).toBe("ftn-p1");
  });

  it("names the kind of choice only when there are modules", () => {
    const [ra, siit] = ["ra", "siit"].map((slug) => getProgram("ftn", slug));
    expect(ra && moduleKindOf(ra)).toBe("module");
    expect(siit && moduleKindOf(siit)).toBe("none");
  });

  it("builds module ids from module names", () => {
    expect(getProgram("ftn", "ra")?.moduleIds).toEqual(["modul-a", "modul-b"]);
  });
});
