import { allTaskIds } from "content-collections";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { launchCookie, launchGate } from "./lib/launch";

const intl = createMiddleware(routing);
const taskIds = new Set(allTaskIds.map((t) => t.id));
const taskPath = new RegExp(
  `^(?:/(${routing.locales.join("|")}))?/bank/([^/]+)$`,
);

export default async function proxy(request: NextRequest) {
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

export const config = {
  matcher: "/((?!api|_next|.*\\.[a-zA-Z0-9]+$).*)",
};
