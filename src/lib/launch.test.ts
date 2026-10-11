import { describe, expect, it } from "vitest";
import { launchGate } from "./launch";

const secret = "team-access-secret-team-access-secret";
const url = (path: string) => new URL(path, "https://doindeksa.rs");

const grantedToken = async () => {
  const gate = await launchGate(url(`/?access=${secret}`), undefined, secret);
  return gate && "redirect" in gate ? gate.token : undefined;
};

const target = async (path: string, cookie?: string) => {
  const gate = await launchGate(url(path), cookie, secret);
  if (!gate) return "pass";
  return "rewrite" in gate
    ? `rewrite ${gate.rewrite.pathname}`
    : `redirect ${gate.redirect.pathname}${gate.redirect.search}`;
};

describe("launchGate", () => {
  it.each(["/", "/ru/bank/x", "/launch"])(
    "passes %s without a secret",
    async (path) => {
      expect(await launchGate(url(path), undefined, undefined)).toBeUndefined();
    },
  );

  it.each([
    ["/", "rewrite /sr-Latn/launch"],
    ["/ru", "rewrite /ru/launch"],
    ["/en", "rewrite /en/launch"],
  ])("rewrites the locale root %s to the launch page", async (path, result) => {
    expect(await target(path)).toBe(result);
  });

  it.each([
    ["/bank", "redirect /"],
    ["/ru/bank/x", "redirect /ru"],
    ["/en/variants", "redirect /en"],
    ["/ru/privacy/x", "redirect /ru"],
    ["/sr-Latn", "redirect /"],
    ["/sr-Latn/bank", "redirect /"],
    ["/launch", "redirect /"],
    ["/sr-Latn/launch", "redirect /"],
    ["/ru/launch", "redirect /ru"],
    ["/bank?access=wrong", "redirect /"],
  ])("redirects %s to its locale root", async (path, result) => {
    expect(await target(path)).toBe(result);
  });

  it.each(["/privacy", "/sr-Latn/privacy", "/ru/privacy", "/en/privacy"])(
    "passes %s without a cookie",
    async (path) => {
      expect(await target(path)).toBe("pass");
    },
  );

  it.each(["", "zz", "0".repeat(64)])(
    "rejects the cookie %j",
    async (cookie) => {
      expect(await target("/bank", cookie)).toBe("redirect /");
    },
  );

  it("rejects a cookie close to the granted one", async () => {
    const token = String(await grantedToken());
    for (const cookie of [`${token.slice(0, -1)}x`, `x${token}`])
      expect(await target("/bank", cookie)).toBe("redirect /");
  });

  it.each(["/", "/ru/bank/x", "/ru/launch"])(
    "passes %s with the granted cookie",
    async (path) => {
      expect(await target(path, await grantedToken())).toBe("pass");
    },
  );

  it("grants the cookie and strips the access param", async () => {
    const gate = await launchGate(
      url(`/ru/bank/x?access=${secret}&a=1`),
      undefined,
      secret,
    );
    expect(gate && "redirect" in gate && gate.redirect.href).toBe(
      "https://doindeksa.rs/ru/bank/x?a=1",
    );
    expect(gate && "redirect" in gate && gate.token).toMatch(/^[0-9a-f]{64}$/);
  });
});
