import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { actionClient } from "./action-client";
import { ensureProfileId } from "./profile";

vi.mock("./profile", () => ({
  ensureProfileId: vi.fn(),
  findProfileId: vi.fn(),
}));

const browser = "Mozilla/5.0 (X11; Linux x86_64) Chrome/141.0 Safari/537.36";
let userAgent = browser;
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": userAgent }),
}));

const input = z.object({ n: z.number() });
const handler = vi.fn(async ({ ctx }: { ctx: { profileId: string } }) => ({
  profileId: ctx.profileId,
}));

const action = actionClient.inputSchema(input).action(handler);

beforeEach(() => {
  userAgent = browser;
  handler.mockClear();
  vi.mocked(ensureProfileId).mockResolvedValue("p1");
});

describe("action clients", () => {
  it("passes the profile id to the action", async () => {
    expect(await action({ n: 1 })).toEqual({ data: { profileId: "p1" } });
  });

  it("refuses a crawler before it gets a profile", async () => {
    userAgent =
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    expect(await action({ n: 1 })).toEqual({ serverError: "bot" });
    expect(ensureProfileId).not.toHaveBeenCalled();
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
    const result = await action({ n: "x" } as never);
    expect(result.validationErrors).toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  });
});
