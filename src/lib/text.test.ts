import { describe, expect, it } from "vitest";
import { fold, slugOf } from "./text";

describe("fold", () => {
  it("reads đ, dj and d as the same letter", () => {
    expect(fold("između")).toBe(fold("izmedju"));
    expect(fold("između")).toBe(fold("izmedu"));
  });

  it("drops diacritics and case", () => {
    expect(fold("Računarstvo")).toBe(fold("racunarstvo"));
  });
});

describe("slugOf", () => {
  it.each([
    [
      "Računarska tehnika i računarske komunikacije",
      "racunarska-tehnika-i-racunarske-komunikacije",
    ],
    ["Računarski upravljački sistemi", "racunarski-upravljacki-sistemi"],
    [
      "Primenjene računarske nauke i informatika",
      "primenjene-racunarske-nauke-i-informatika",
    ],
    ["Građevinarstvo", "gradjevinarstvo"],
  ])("makes %s into %s", (name, slug) => {
    expect(slugOf(name)).toBe(slug);
  });
});
