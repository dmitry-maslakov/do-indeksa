import { describe, expect, it } from "vitest";
import { clientEvents, suggestionShown } from "./progress-events";

const opened = clientEvents.find(
  ({ name }) => name === "suggestion_opened",
)?.props;
const shown = { topic: "complex-numbers", reason: "first" };
const id = "6f1d3c1e-2a51-4c36-9a5e-3b1e0e6b4b8a";

describe("suggestion events", () => {
  it.each([
    ["a suggestion shown without a profile", suggestionShown.props, shown],
    [
      "a stored suggestion",
      suggestionShown.props,
      { ...shown, suggestion_id: id },
    ],
    [
      "an open before the id arrives",
      opened,
      { ...shown, since_shown_ms: 1200 },
    ],
    [
      "an open with its id",
      opened,
      { ...shown, suggestion_id: id, since_shown_ms: 0 },
    ],
  ])("accepts %s", (_, schema, value) => {
    expect(schema?.safeParse(value).success).toBe(true);
  });

  it.each([
    [
      "an unknown topic",
      suggestionShown.props,
      { ...shown, topic: "astrology" },
    ],
    [
      "an unknown reason",
      suggestionShown.props,
      { ...shown, reason: "random" },
    ],
    ["an open without its delay", opened, shown],
    ["a negative delay", opened, { ...shown, since_shown_ms: -1 }],
  ])("rejects %s", (_, schema, value) => {
    expect(schema?.safeParse(value).success).toBe(false);
  });
});
