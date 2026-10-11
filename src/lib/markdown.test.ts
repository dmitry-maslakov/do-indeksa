import { describe, expect, it } from "vitest";
import { excerpt, headline } from "./markdown";

describe("excerpt", () => {
  it("joins paragraphs with a space", () => {
    expect(excerpt("a\n\nb")).toBe("a b");
  });

  it("keeps short text unchanged", () => {
    expect(excerpt("Odrediti moduo.")).toBe("Odrediti moduo.");
  });

  it("keeps formulas that are plain text", () => {
    expect(excerpt("Stranica je $13$, a tačka $A(1,-1)$.")).toBe(
      "Stranica je 13, a tačka A(1,-1).",
    );
  });

  it("ends before the first formula with markup", () => {
    expect(excerpt("Data je jednačina $x^2=1$, $m=2$.")).toBe(
      "Data je jednačina…",
    );
    expect(excerpt("Rešiti jednačinu:\n\n$$4^{x}=2.$$")).toBe(
      "Rešiti jednačinu…",
    );
    expect(excerpt("Odrediti **broj $\\sqrt{2}$** i $3$.")).toBe(
      "Odrediti broj…",
    );
  });

  it("is empty when the statement opens with a formula", () => {
    expect(excerpt("$\\pi$ je broj.")).toBe("");
  });
});

describe("headline", () => {
  it("takes the first sentence of the first block", () => {
    expect(headline("Dat je broj $13$. Naći ga.\n\nDrugi blok.")).toBe(
      "Dat je broj 13",
    );
    expect(headline("Rešiti jednačinu\n\n$$x=1.$$")).toBe("Rešiti jednačinu");
  });

  it("ends before a formula with markup", () => {
    expect(headline("Data je funkcija $f(x)=x^2$.")).toBe("Data je funkcija…");
    expect(headline("Odrediti **broj $\\sqrt{2}$** i $3$.")).toBe(
      "Odrediti broj…",
    );
  });

  it("is empty when the statement opens with a formula", () => {
    expect(headline("$x^2=1$ je jednačina.")).toBe("");
  });
});
