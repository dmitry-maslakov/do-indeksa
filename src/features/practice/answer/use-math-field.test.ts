import { describe, expect, it } from "vitest";
import { decimalComma } from "./use-math-field";

describe("decimalComma", () => {
  it("writes the decimal point of the key as the comma the field uses", () => {
    expect(decimalComma("19.1")).toBe("19{,}1");
    expect(decimalComma("x=0.3010275")).toBe("x=0{,}3010275");
    expect(decimalComma("1.5+2.25")).toBe("1{,}5+2{,}25");
  });

  it("leaves everything else as it is", () => {
    expect(decimalComma("\\frac{60}{13}")).toBe("\\frac{60}{13}");
    expect(decimalComma("19{,}1")).toBe("19{,}1");
    expect(decimalComma("x.")).toBe("x.");
  });
});
