import { describe, expect, it } from "vitest";
import { fold } from "./text";

describe("fold", () => {
  it("spells đ as dj", () => {
    expect(fold("Đurđevdan")).toBe("djurdjevdan");
  });

  it("drops diacritics and case", () => {
    expect(fold("Računarstvo")).toBe(fold("racunarstvo"));
  });
});
