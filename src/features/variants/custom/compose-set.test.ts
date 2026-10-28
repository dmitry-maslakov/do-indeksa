import { describe, expect, it } from "vitest";
import { composeSchema } from "./compose-set";

const parse = (input: object) => composeSchema.parse(input);

describe("composeSchema", () => {
  it("accepts one topic or several", () => {
    expect(parse({ topic: "logarithms" }).topic).toEqual(["logarithms"]);
    expect(
      parse({ topic: ["logarithms", "trigonometry"] }).topic.sort(),
    ).toEqual(["logarithms", "trigonometry"]);
    expect(parse({}).topic).toEqual([]);
  });

  it("drops unknown topics and repeats", () => {
    const topic = ["logarithms", "nope", ...Array(5000).fill("logarithms")];
    expect(parse({ topic }).topic).toEqual(["logarithms"]);
  });

  it("falls back to the exam mode", () => {
    expect(parse({ mode: "weak" }).mode).toBe("weak");
    expect(parse({ mode: "nope" }).mode).toBe("exam");
  });

  it("keeps the count within the exam size", () => {
    expect(parse({ count: "5" }).count).toBe(5);
    expect(parse({ count: "0" }).count).toBe(parse({}).count);
    expect(parse({ count: "99" }).count).toBe(parse({}).count);
  });
});
