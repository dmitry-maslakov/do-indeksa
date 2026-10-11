import { describe, expect, it } from "vitest";
import { excerpt } from "./markdown";

describe("excerpt", () => {
  it("joins paragraphs with a space", () => {
    expect(excerpt("a\n\nb")).toBe("a b");
  });

  it("keeps short text unchanged", () => {
    expect(excerpt("Odrediti moduo.")).toBe("Odrediti moduo.");
  });

  it("cuts long text at a word boundary", () => {
    const text = excerpt("reč ".repeat(60));
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text).toMatch(/reč…$/);
  });

  it("cuts text without spaces at the length", () => {
    expect(excerpt("x".repeat(200), 10)).toBe(`${"x".repeat(9)}…`);
  });

  it("keeps the inline math source", () => {
    expect(excerpt("Rešiti $x^2=1$.")).toBe("Rešiti x^2=1.");
  });
});
