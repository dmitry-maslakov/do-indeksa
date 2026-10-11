import { allTaskIds } from "content-collections";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const taskIds = new Set(allTaskIds.map((t) => t.id));
const taskPath = new RegExp(
  `^(?:/(${routing.locales.join("|")}))?/bank/([^/]+)$`,
);

export default function proxy(request: NextRequest) {
  const [, locale = routing.defaultLocale, id] =
    taskPath.exec(request.nextUrl.pathname) ?? [];
  return id && !taskIds.has(id)
    ? NextResponse.rewrite(new URL(`/${locale}/404`, request.url))
    : intl(request);
}

export const config = {
  matcher: "/((?!api|_next|.*\\.[a-zA-Z0-9]+$).*)",
};
