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

  it("depends on the content", () => {
    expect(setCode(["kb-001", "log-002"])).not.toBe(
      setCode(["kb-001", "log-003"]),
    );
  });

  it("is sixteen url-safe characters", () => {
    expect(setCode(["kb-001", "log-002"])).toMatch(/^[\w-]{16}$/);
  });
});
