import { describe, expect, it } from "vitest";
import {
  createInstances,
  envelope,
  fallbackGlyphs,
  formulas,
  hash,
  layoutFormula,
  position,
  slot,
} from "./field";

const phone = { width: 390, height: 844 };
const desktop = { width: 1440, height: 900 };

describe("envelope", () => {
  it("gathers, holds and dissolves", () => {
    expect(envelope(0)).toBe(0);
    expect(envelope(1.2)).toBeCloseTo(0.5);
    for (const f of [2.4, 3.5, 4.99]) expect(envelope(f)).toBe(1);
    expect(envelope(6.2)).toBeCloseTo(0.5);
    for (const f of [7.4, 9, 11.9]) expect(envelope(f)).toBe(0);
  });

  it("ramps monotonically", () => {
    const steps = Array.from({ length: 25 }, (_, i) => i / 10);
    const up = steps.map(envelope);
    const down = steps.map((f) => envelope(5 + f));
    expect(up).toEqual([...up].sort((a, b) => a - b));
    expect(down).toEqual([...down].sort((a, b) => b - a));
  });
});

describe("hash", () => {
  it("is deterministic and in [0, 1)", () => {
    for (let i = 0; i < 500; i++) {
      expect(hash(i)).toBe(hash(i));
      expect(hash(i)).toBeGreaterThanOrEqual(0);
      expect(hash(i)).toBeLessThan(1);
    }
  });

  it("places the css field inside the screen", () => {
    expect(fallbackGlyphs).toHaveLength(34);
    for (const g of fallbackGlyphs) {
      expect(Number.parseFloat(g.left)).toBeLessThan(96);
      expect(Number.parseFloat(g.top)).toBeLessThan(95);
    }
  });
});

describe("position", () => {
  it("wraps inside the padded viewport", () => {
    for (const viewport of [phone, desktop]) {
      const instances = createInstances(viewport);
      for (const instance of instances)
        for (let t = 0; t <= 600; t += 7.5) {
          const [x, y] = position(instance, t, viewport);
          expect(x).toBeGreaterThanOrEqual(-250);
          expect(x).toBeLessThanOrEqual(viewport.width + 250);
          expect(y).toBeGreaterThanOrEqual(-250);
          expect(y).toBeLessThanOrEqual(viewport.height + 250);
        }
    }
  });
});

describe("layoutFormula", () => {
  const measure = (token: string) => (token.length > 1 ? 1.2 : 0.6);
  const headline = (viewport: typeof phone, w: number, h: number) =>
    [
      viewport.width / 2,
      viewport.height / 2,
      w / 2 + viewport.width * 0.05,
      h / 2 + viewport.height * 0.06,
    ] as const;

  for (const [viewport, mask] of [
    [phone, headline(phone, 280, 220)],
    [desktop, headline(desktop, 560, 270)],
  ] as const)
    it(`keeps formulas clear of the headline at ${viewport.width}px`, () => {
      for (let cycle = 0; cycle < 8; cycle++)
        for (const formula of formulas) {
          const { box, tokens } = layoutFormula(
            formula,
            slot(cycle, viewport),
            viewport,
            measure,
          );
          const [x, y, w, h] = box;
          expect(x - w).toBeGreaterThan(0);
          expect(x + w).toBeLessThan(viewport.width);
          expect(y - h).toBeGreaterThan(0);
          expect(y + h).toBeLessThan(viewport.height);
          const [mx, my, mw, mh] = mask;
          const apart = Math.abs(x - mx) > w + mw || Math.abs(y - my) > h + mh;
          expect(apart).toBe(true);
          expect(tokens.every((t) => t.glyph >= 0)).toBe(true);
        }
    });
});
