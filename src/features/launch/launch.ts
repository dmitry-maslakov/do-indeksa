import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export const launchCookie = "launch-access";

export const launchPages = ["/", "/privacy", "/terms"];

type Gate = { redirect: URL; token?: string } | { rewrite: URL };

const bytes = (value: string) => new TextEncoder().encode(value);

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");

export async function launchGate(
  url: URL,
  cookie: string | undefined,
  secret: string | undefined,
): Promise<Gate | undefined> {
  if (!secret) return;
  const key = await crypto.subtle.importKey(
    "raw",
    bytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sign = (value: string) => crypto.subtle.sign("HMAC", key, bytes(value));
  const matches = async (value: string, expected: string) =>
    crypto.subtle.verify("HMAC", key, await sign(value), bytes(expected));
  const token = hex(await sign(secret));

  const access = url.searchParams.get("access");
  if (access !== null && (await matches(access, secret))) {
    const redirect = new URL(url);
    redirect.searchParams.delete("access");
    return { redirect, token };
  }
  if (cookie !== undefined && (await matches(cookie, token))) return;

  const [, segment] = url.pathname.split("/");
  const locale = hasLocale(routing.locales, segment)
    ? segment
    : routing.defaultLocale;
  const root = locale === routing.defaultLocale ? "/" : `/${locale}`;
  if (url.pathname === root)
    return { rewrite: new URL(`/${locale}/launch`, url) };
  const page =
    segment === locale ? url.pathname.slice(locale.length + 1) : url.pathname;
  if (launchPages.includes(page)) return;
  return { redirect: new URL(root, url) };
}
