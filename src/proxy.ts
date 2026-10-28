import * as Sentry from "@sentry/nextjs";
import {
  allMethodSlugs,
  allTaskIds,
  allTheoryIds,
  allVariants,
} from "content-collections";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { positions } from "@/features/catalog/exams";
import { launchCookie, launchGate } from "@/features/launch/launch";
import { composeSegment, customTaskIds } from "@/features/variants/variant-id";
import { daySeconds } from "@/lib/dates";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const idsOf = (items: { id: string }[]) => new Set(items.map((i) => i.id));
const taskIds = idsOf(allTaskIds);
const topicIds = idsOf(allTheoryIds);
const variantIds = idsOf(allVariants);
const localePath = new RegExp(`^(?:/(${routing.locales.join("|")}))?(/.*)$`);

const contentPages: [RegExp, (...ids: string[]) => boolean][] = [
  [/^\/bank\/([^/]+)$/, (id) => taskIds.has(id)],
  [/^\/theory\/([^/]+)(?:\/methods)?$/, (topic) => topicIds.has(topic)],
  [
    /^\/theory\/([^/]+)\/methods\/([^/]+)$/,
    (topic, slug) =>
      allMethodSlugs.some((m) => m.topic === topic && m.slug === slug),
  ],
  [
    /^\/variants\/([^/]+)$/,
    (id) =>
      id === composeSegment ||
      variantIds.has(id) ||
      customTaskIds(id, positions.length, (taskId) => taskIds.has(taskId)) !==
        undefined,
  ],
];

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
        maxAge: 365 * daySeconds,
      });
    return response;
  }
  const [, locale = routing.defaultLocale, path = ""] =
    localePath.exec(request.nextUrl.pathname) ?? [];
  const missing = contentPages.some(([pattern, exists]) => {
    const ids = pattern.exec(path)?.slice(1);
    return ids && !exists(...ids);
  });
  return missing
    ? NextResponse.rewrite(new URL(`/${locale}/404`, request.url))
    : intl(request);
}

export default async function proxy(request: NextRequest) {
  return withTraceTiming(await respond(request));
}

export const config = {
  matcher: "/((?!api|_next|.*\\.[a-zA-Z0-9]+$).*)",
};
