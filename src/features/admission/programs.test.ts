import { describe, expect, it } from "vitest";
import {
  checkedPrograms,
  getProgram,
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

  it("lists checked neighbours on the same exam without the programme", () => {
    const ra = getProgram("ftn", "ra");
    expect(ra && neighbours(ra).map((p) => p.slug)).toEqual(["siit"]);
    expect(ra && programExam(ra).id).toBe("ftn-p1");
  });

  it("builds module ids from module names", () => {
    expect(getProgram("ftn", "ra")?.moduleIds).toEqual(["modul-a", "modul-b"]);
  });
});
