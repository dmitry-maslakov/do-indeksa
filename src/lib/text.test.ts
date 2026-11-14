import { describe, expect, it } from "vitest";
import { fold, slugOf } from "./text";

describe("fold", () => {
  it("spells đ as dj", () => {
    expect(fold("Đurđevdan")).toBe("djurdjevdan");
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
