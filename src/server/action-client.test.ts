import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { actionClient, authActionClient } from "./action-client";
import { getProfileId } from "./auth";

vi.mock("./auth", () => ({ getProfileId: vi.fn() }));

const input = z.object({ n: z.number() });
const handler = vi.fn(async ({ ctx }: { ctx: { profileId?: string } }) => ({
  profileId: ctx.profileId,
}));

const guestAction = actionClient.inputSchema(input).action(handler);
const userAction = authActionClient.inputSchema(input).action(handler);

beforeEach(() => {
  handler.mockClear();
  vi.mocked(getProfileId).mockResolvedValue(undefined);
});

describe("action clients", () => {
  it("lets a guest through the base client without a profile id", async () => {
    expect(await guestAction({ n: 1 })).toEqual({
      data: { profileId: undefined },
    });
  });

  it("passes the profile id to the base client", async () => {
    vi.mocked(getProfileId).mockResolvedValue("p1");
    expect(await guestAction({ n: 1 })).toEqual({ data: { profileId: "p1" } });
  });

  it("rejects a guest before the authenticated action runs", async () => {
    expect(await userAction({ n: 1 })).toEqual({ serverError: "unauthorized" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the profile id to the authenticated action", async () => {
    vi.mocked(getProfileId).mockResolvedValue("p1");
    expect(await userAction({ n: 1 })).toEqual({ data: { profileId: "p1" } });
  });

  it("logs an unexpected error and returns only its code", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = actionClient.action(async () => {
      throw new Error("database is down");
    });
    expect(await failing()).toEqual({ serverError: "unexpected" });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ message: "database is down" }),
    );
    log.mockRestore();
  });

  it("returns validation errors for invalid input", async () => {
    vi.mocked(getProfileId).mockResolvedValue("p1");
    const result = await userAction({ n: "x" } as never);
    expect(result.validationErrors).toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  });
});
