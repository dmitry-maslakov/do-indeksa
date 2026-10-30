import { describe, expect, it } from "vitest";
import { clientEvents, profileMerged } from "./account-events";

const events = [profileMerged, ...clientEvents];

const schemaOf = (name: string) =>
  events.find((event) => event.name === name)?.props;

const guest = "6f1d3c1e-2a51-4c36-9a5e-3b1e0e6b4b8a";

const valid = {
  profile_merged: {
    outcome: "claimed",
    from_profile_id: guest,
    to_profile_id: guest,
    guest_had_progress: true,
    own_had_progress: false,
    guest_age_days: 3,
  },
  sign_in_prompt_shown: { from: "task", solved: 5 },
  sign_in_prompt_closed: {
    from: "one_tap",
    moment: "dismissed",
    reason: "cancel_called",
  },
  sign_in_started: { from: "privacy" },
  signed_out: {},
};

const invalid = {
  profile_merged: {
    outcome: "merged",
    from_profile_id: "guest",
    to_profile_id: guest,
    guest_had_progress: true,
    own_had_progress: false,
    guest_age_days: 0,
  },
  sign_in_prompt_shown: { from: "header" },
  sign_in_prompt_closed: { from: "one_tap", moment: "no thanks" },
  sign_in_started: { from: "footer" },
  signed_out: { profile_id: guest },
};

describe("account events", () => {
  it.each(Object.entries(valid))("accepts %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(true);
  });

  it.each(Object.entries(invalid))("rejects a bad %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(false);
  });

  it("covers every event", () => {
    expect(events.map(({ name }) => name).toSorted()).toEqual(
      Object.keys(valid).toSorted(),
    );
  });
});
