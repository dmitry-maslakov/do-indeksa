import { getOAuthState } from "better-auth/api";
import { describe, expect, it, vi } from "vitest";
import { signUpSource } from "./sign-up-source";

vi.mock("better-auth/api", () => ({ getOAuthState: vi.fn() }));

const state = (value: unknown) =>
  vi.mocked(getOAuthState).mockResolvedValue(value as never);

describe("signUpSource", () => {
  it("keeps a known source", async () => {
    state({ from: "header" });
    expect(await signUpSource()).toBe("header");
  });

  it("drops an unknown source", async () => {
    state({ from: "<script>" });
    expect(await signUpSource()).toBeNull();
  });

  it("is empty without a source", async () => {
    state(null);
    expect(await signUpSource()).toBeNull();
  });
});
