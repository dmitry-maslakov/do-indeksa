import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { actionClient, authActionClient } from "./action-client";
import { getSession } from "./auth";

vi.mock("./auth", () => ({ getSession: vi.fn() }));

const input = z.object({ n: z.number() });
const handler = vi.fn(async ({ ctx }: { ctx: { userId?: string } }) => ({
  userId: ctx.userId,
}));

const guestAction = actionClient.inputSchema(input).action(handler);
const userAction = authActionClient.inputSchema(input).action(handler);

beforeEach(() => {
  handler.mockClear();
  vi.mocked(getSession).mockResolvedValue(null);
});

describe("action clients", () => {
  it("lets a guest through the base client without a user id", async () => {
    expect(await guestAction({ n: 1 })).toEqual({
      data: { userId: undefined },
    });
  });

  it("passes the signed-in user id to the base client", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "u1" } } as never);
    expect(await guestAction({ n: 1 })).toEqual({ data: { userId: "u1" } });
  });

  it("rejects a guest before the authenticated action runs", async () => {
    expect(await userAction({ n: 1 })).toEqual({ serverError: "unauthorized" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the user id to the authenticated action", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "u1" } } as never);
    expect(await userAction({ n: 1 })).toEqual({ data: { userId: "u1" } });
  });

  it("returns validation errors for invalid input", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "u1" } } as never);
    const result = await userAction({ n: "x" } as never);
    expect(result.validationErrors).toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  });
});
