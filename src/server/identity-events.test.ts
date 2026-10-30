import { describe, expect, it } from "vitest";
import { profileCreated } from "./identity-events";

const events = [profileCreated];

const schemaOf = (name: string) =>
  events.find((event) => event.name === name)?.props;

const valid = {
  profile_created: { kind: "guest" },
};

const invalid = {
  profile_created: { kind: "bot" },
};

describe("identity events", () => {
  it.each(Object.entries(valid))("accepts %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(true);
  });

  it.each(Object.entries(invalid))("rejects a bad %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(false);
  });
});
