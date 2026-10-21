import * as Sentry from "@sentry/nextjs";
import { allTaskIds } from "content-collections";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { launchCookie, launchGate } from "@/features/launch/launch";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const taskIds = new Set(allTaskIds.map((t) => t.id));
const taskPath = new RegExp(
  `^(?:/(${routing.locales.join("|")}))?/bank/([^/]+)$`,
);

function withTraceTiming(response: NextResponse) {
  const timing = Object.entries(Sentry.getTraceData())
    .map(([name, value]) => `${name};desc="${value}"`)
    .join(", ");
  if (timing) response.headers.append("Server-Timing", timing);
  return response;
}

async function respond(request: NextRequest) {
  const gate = await launchGate(
    request.nextUrl,
    request.cookies.get(launchCookie)?.value,
    process.env.LAUNCH_ACCESS,
  );
  if (gate && "rewrite" in gate) return NextResponse.rewrite(gate.rewrite);
  if (gate) {
    const response = NextResponse.redirect(gate.redirect);
    if (gate.token)
      response.cookies.set(launchCookie, gate.token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    return response;
  }
  const [, locale = routing.defaultLocale, id] =
    taskPath.exec(request.nextUrl.pathname) ?? [];
  return id && !taskIds.has(id)
    ? NextResponse.rewrite(new URL(`/${locale}/404`, request.url))
    : intl(request);
}

export default async function proxy(request: NextRequest) {
  return withTraceTiming(await respond(request));
}

export const config = {
  matcher: "/((?!api|_next|.*\\.[a-zA-Z0-9]+$).*)",
};
