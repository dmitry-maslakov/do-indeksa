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
import { bankHref, pageOf } from "@/features/bank/params";
import { maxPlaces } from "@/features/catalog/exams";
import { customTaskIds } from "@/features/variants/variant-id";
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
  "/bank/topic/[topic]/[page]": (topic, page) =>
    bankTopicIds.has(topic) && pageOf(page) !== undefined,
  "/theory/[topic]": topicExists,
  "/theory/[topic]/methods": topicExists,
  "/theory/[topic]/methods/[method]": (topic, slug) =>
    allMethodSlugs.some((m) => m.topic === topic && m.slug === slug),
  "/variants/[id]": (id) =>
    variantIds.has(id) ||
    customTaskIds(id, maxPlaces, (taskId) => taskIds.has(taskId)) !== undefined,
  "/variants/[id]/solutions": (id) => variantIds.has(id),
};

function withTraceTiming(response: NextResponse) {
  const timing = Object.entries(Sentry.getTraceData())
    .map(([name, value]) => `${name};desc="${value}"`)
    .join(", ");
  if (timing) response.headers.append("Server-Timing", timing);
  return response;
}

async function respond(request: NextRequest) {
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
  matcher: "/((?!api|_next|.*/opengraph-image$|.*\\.[a-zA-Z0-9]+$).*)",
};
