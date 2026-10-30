import { describe, expect, it } from "vitest";
import { clientEvents } from "./theory-events";

const theoryRead = clientEvents.find(
  ({ name }) => name === "theory_read",
)?.props;

const read = {
  read_id: "6f1d3c1e-2a51-4c36-9a5e-3b1e0e6b4b8a",
  topic: "exponential-equations",
  page: "topic",
  sections: 4,
  sections_reached: 2,
  last_section: "jednacine",
  max_scroll_pct: 55,
  visible_ms: 48000,
  exit: "hidden",
  seq: 1,
};

describe("theory_read", () => {
  it("accepts a reading summary", () => {
    expect(theoryRead?.safeParse(read).success).toBe(true);
  });

  it.each([
    ["an unknown topic", { ...read, topic: "astrology" }],
    ["an unknown method", { ...read, page: "method", method: "guessing" }],
    ["no read id", { ...read, read_id: undefined }],
    ["a scroll past the end", { ...read, max_scroll_pct: 120 }],
    ["no sequence number", { ...read, seq: 0 }],
    ["an unknown exit", { ...read, exit: "crash" }],
  ])("rejects %s", (_, props) => {
    expect(theoryRead?.safeParse(props).success).toBe(false);
  });
});
