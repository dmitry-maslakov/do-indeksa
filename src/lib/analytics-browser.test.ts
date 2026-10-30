import { describe, expect, it } from "vitest";
import {
  navigationStarted,
  rememberIntent,
  takeIntent,
} from "./analytics-browser";

const picked = { via: "picker", placement: "topic_select" };

describe("intents", () => {
  it("belong to the navigation that follows them, once", () => {
    rememberIntent(picked);
    expect(takeIntent()).toBeUndefined();
    navigationStarted("push");
    expect(takeIntent()).toEqual(picked);
    expect(takeIntent()).toBeUndefined();
  });

  it("do not carry over to a later navigation", () => {
    rememberIntent(picked);
    navigationStarted("push");
    navigationStarted("replace");
    expect(takeIntent()).toBeUndefined();
  });

  it("mark back and forward as history", () => {
    rememberIntent(picked);
    navigationStarted("traverse");
    expect(takeIntent()).toEqual({ via: "history" });
  });
});
