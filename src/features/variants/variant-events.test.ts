import { describe, expect, it } from "vitest";
import { clientEvents } from "./variant-events";

const solutionsRead = clientEvents.find(
  ({ name }) => name === "solutions_read",
)?.props;

const read = {
  read_id: "6f1d3c1e-2a51-4c36-9a5e-3b1e0e6b4b8a",
  variant_id: "ftn-p1-2025",
  sections: 10,
  sections_reached: 4,
  last_section: "task-4",
  section_ms: [8000, 0, 41000, 2000, 0, 0, 0, 0, 0, 0],
  max_scroll_pct: 38,
  visible_ms: 64000,
  active_ms: 52000,
  exit: "navigate",
  seq: 1,
};

describe("solutions_read", () => {
  it("accepts a reading summary", () => {
    expect(solutionsRead?.safeParse(read).success).toBe(true);
  });

  it.each([
    ["an unknown exam", { ...read, variant_id: "ftn-p1-1999" }],
    ["no read id", { ...read, read_id: undefined }],
    ["fractional time in a task", { ...read, section_ms: [0.5] }],
    ["an unknown exit", { ...read, exit: "crash" }],
  ])("rejects %s", (_, props) => {
    expect(solutionsRead?.safeParse(props).success).toBe(false);
  });
});
