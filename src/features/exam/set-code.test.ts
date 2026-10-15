import { describe, expect, it } from "vitest";
import { parseSetCode, setCode } from "./set-code";

describe("setCode", () => {
  it("is at least five readable characters", () => {
    for (const id of [1, 2, 99, 123_456, 2_147_483_647]) {
      expect(setCode(id)).toMatch(/^[2-9A-HJKMNP-Z]{5,}$/);
    }
  });

  it("does not read as a counter", () => {
    expect(setCode(2).slice(0, 3)).not.toBe(setCode(1).slice(0, 3));
  });

  it("round-trips through parseSetCode", () => {
    for (const id of [1, 2, 99, 123_456]) {
      expect(parseSetCode(setCode(id))).toEqual({ id });
    }
  });
});

describe("parseSetCode", () => {
  it("ignores case", () => {
    expect(parseSetCode(setCode(42).toLowerCase())).toEqual({ id: 42 });
  });

  it("keeps old seven and sixteen character codes as they are", () => {
    expect(parseSetCode("aB3-x_Q")).toEqual({ legacy: "aB3-x_Q" });
    expect(parseSetCode("aB3-x_QaB3-x_Q12")).toEqual({
      legacy: "aB3-x_QaB3-x_Q12",
    });
  });

  it("rejects codes that are not canonical", () => {
    expect(parseSetCode("")).toBeUndefined();
    expect(parseSetCode("0OIL1")).toBeUndefined();
    expect(parseSetCode(`${setCode(42)}K`)).toBeUndefined();
  });
});
