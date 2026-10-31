import * as Sentry from "@sentry/nextjs";
import {
  allMethodSlugs,
  allTaskIds,
  allTheoryIds,
  allTopics,
  allVariants,
} from "content-collections";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { bankHref } from "@/features/bank/params";
import { positions } from "@/features/catalog/exams";
import { launchCookie, launchGate } from "@/features/launch/launch";
import { customTaskIds } from "@/features/variants/variant-id";
import { daySeconds } from "@/lib/dates";
import { type RouteTemplate, routeOf } from "@/lib/routes";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const idsOf = (items: { id: string }[]) => new Set(items.map((i) => i.id));
const taskIds = idsOf(allTaskIds);
const topicIds = idsOf(allTheoryIds);
const variantIds = idsOf(allVariants);
const bankTopicIds = idsOf(allTopics);
const topicExists = (topic: string) => topicIds.has(topic);

const contentPages: Partial<
  Record<RouteTemplate, (...ids: string[]) => boolean>
> = {
  "/bank/[id]": (id) => taskIds.has(id),
  "/bank/topic/[topic]": (topic) => bankTopicIds.has(topic),
  "/theory/[topic]": topicExists,
  "/theory/[topic]/methods": topicExists,
  "/theory/[topic]/methods/[method]": (topic, slug) =>
    allMethodSlugs.some((m) => m.topic === topic && m.slug === slug),
  "/variants/[id]": (id) =>
    variantIds.has(id) ||
    customTaskIds(id, positions.length, (taskId) => taskIds.has(taskId)) !==
      undefined,
};

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
  const { locale, route, params } = routeOf(request.nextUrl.pathname);
  const topic = request.nextUrl.searchParams.get("topic");
  if (route === "/bank" && topic !== null) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname.replace(/\/bank$/, bankHref({ topic }));
    url.searchParams.delete("topic");
    return NextResponse.redirect(url, 308);
  }
  return contentPages[route]?.(...params) === false
    ? NextResponse.rewrite(new URL(`/${locale}/404`, request.url))
    : intl(request);
}

export default async function proxy(request: NextRequest) {
  return withTraceTiming(await respond(request));
}

export const config = {
  matcher: "/((?!api|_next|.*\\.[a-zA-Z0-9]+$).*)",
};
