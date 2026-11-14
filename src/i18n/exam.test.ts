import { describe, expect, it } from "vitest";
import { examHref } from "./exam";

describe("examHref", () => {
  it.each([
    ["/ftn/p1", "/", "/ftn/p1"],
    ["/ftn/p1", "/bank/eks-001", "/ftn/p1/bank/eks-001"],
    ["/ftn/p1", "#bodovi", "#bodovi"],
    ["/ftn/p1", "?tab=history", "?tab=history"],
    [null, "/privacy", "/privacy"],
    [undefined, "/terms", "/terms"],
    ["/ftn/p3", "/bank", "/ftn/p3/bank"],
  ])("puts %s before %s", (base, href, expected) => {
    expect(examHref(base, href)).toBe(expected);
  });

  it("prefixes the pathname of an object href", () => {
    expect(
      examHref("/ftn/p1", { pathname: "/variants", query: { tab: "history" } }),
    ).toEqual({ pathname: "/ftn/p1/variants", query: { tab: "history" } });
  });
});
