import { describe, expect, it } from "vitest";
import { profileCreated, signedIn } from "./identity-events";

const events = [profileCreated, signedIn];

const schemaOf = (name: string) =>
  events.find((event) => event.name === name)?.props;

const valid = {
  profile_created: { kind: "guest" },
  signed_in: {
    method: "google",
    from: "task",
    new_account: true,
    had_guest: true,
  },
};

const invalid = {
  profile_created: { kind: "bot" },
  signed_in: { method: "email", new_account: true, had_guest: false },
};

describe("identity events", () => {
  it.each(Object.entries(valid))("accepts %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(true);
  });

  it.each(Object.entries(invalid))("rejects a bad %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(false);
  });
});
