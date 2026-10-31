import { getOAuthState } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "./analytics";
import { auth } from "./auth";
import { guestToken, markGuestToAdopt, profileIdOf } from "./profile";
import { reportServerError } from "./report";

vi.mock("./analytics", () => ({ track: vi.fn() }));
vi.mock("./profile", () => ({
  guestToken: vi.fn(),
  markGuestToAdopt: vi.fn(),
  profileIdOf: vi.fn(),
}));
vi.mock("./report", () => ({ reportServerError: vi.fn() }));
vi.mock("./db", () => ({ db: {} }));
vi.mock("./env", () => ({
  env: {
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "test-only-secret-test-only-secret",
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "secret",
  },
}));
vi.mock("better-auth/api", async (original) => ({
  ...(await original()),
  getOAuthState: vi.fn(),
}));

const { user, session } = auth.options.databaseHooks;
const signUp = () => user.create.after({ id: "u1" } as never);
const signIn = (path: string) =>
  session.create.after({ userId: "u1" } as never, { path } as never);
const signedIn = (props: object, profileId?: string) =>
  expect(track).toHaveBeenLastCalledWith(
    expect.objectContaining({ name: "signed_in" }),
    props,
    { profileId },
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOAuthState).mockResolvedValue(null);
  vi.mocked(guestToken).mockResolvedValue(undefined);
  vi.mocked(profileIdOf).mockResolvedValue(undefined);
});

describe("signed_in", () => {
  it("records a new account with its source and its guest profile", async () => {
    vi.mocked(getOAuthState).mockResolvedValue({ from: "task" } as never);
    vi.mocked(guestToken).mockResolvedValue("token");
    vi.mocked(profileIdOf).mockResolvedValue("guest");
    await signUp();
    await signIn("/callback/:id");
    signedIn(
      { method: "google", from: "task", new_account: true, had_guest: true },
      "guest",
    );
    expect(profileIdOf).toHaveBeenCalledWith("u1", "token");
  });

  it("records a returning One Tap sign-in", async () => {
    await signIn("/one-tap/callback");
    signedIn({ method: "one_tap", new_account: false, had_guest: false });
  });

  it("lets the sign-in go on when recording fails", async () => {
    vi.mocked(profileIdOf).mockRejectedValue(new Error("db down"));
    await expect(signIn("/callback/:id")).resolves.toBeUndefined();
    expect(reportServerError).toHaveBeenCalled();
  });
});

describe("guest adoption", () => {
  it("marks the guest for adoption when signing in with a guest cookie", async () => {
    vi.mocked(guestToken).mockResolvedValue("token");
    await signIn("/one-tap/callback");
    expect(markGuestToAdopt).toHaveBeenCalled();
  });

  it("leaves no mark without a guest cookie", async () => {
    await signIn("/callback/:id");
    expect(markGuestToAdopt).not.toHaveBeenCalled();
  });
});
