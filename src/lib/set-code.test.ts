import { describe, expect, it } from "vitest";
import { setCode } from "./set-code";

describe("setCode", () => {
  it("is stable for the same list", () => {
    expect(setCode(["kb-001", "log-002"])).toBe(setCode(["kb-001", "log-002"]));
  });

  it("depends on the order", () => {
    expect(setCode(["kb-001", "log-002"])).not.toBe(
      setCode(["log-002", "kb-001"]),
    );
  });

  it("is seven url-safe characters", () => {
    expect(setCode(["kb-001", "log-002"])).toMatch(/^[\w-]{7}$/);
  });
});
