import { describe, expect, it } from "vitest";
import { reviewHref } from "./review-href";

describe("reviewHref", () => {
  it("links to the first eight characters of the run id", () => {
    expect(reviewHref("0a1b2c3d-4e5f-6789-abcd-ef0123456789")).toBe(
      "/review/0a1b2c3d",
    );
  });
});
