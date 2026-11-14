import * as Sentry from "@sentry/nextjs";
import { getSessionCookie } from "better-auth/cookies";
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
import {
  examByPath,
  examOf,
  firstOpenExam,
  maxPlaces,
  openExamPath,
} from "@/features/catalog/exams";
import { customTaskIds } from "@/features/variants/variant-id";
import { examCookie, profileCookie } from "@/lib/cookies";
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

const notFound = (request: NextRequest, locale: string) =>
  NextResponse.rewrite(new URL(`/${locale}/404`, request.url));

const firstExamPath = () => examOf(firstOpenExam()).path;

function returningTo(request: NextRequest) {
  const chosen = openExamPath(request.cookies.get(examCookie)?.value ?? "");
  if (chosen) return chosen;
  if (request.cookies.has(profileCookie) || getSessionCookie(request))
    return firstExamPath();
}

function toExam(request: NextRequest, locale: string, path: string) {
  const url = request.nextUrl.clone();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  url.pathname = `${prefix}${path}`;
  const response = NextResponse.redirect(url, 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function respond(request: NextRequest) {
  const { locale, exam, route, params } = routeOf(request.nextUrl.pathname);
  if (route === "/" && !exam)
    return toExam(request, locale, returningTo(request) ?? firstExamPath());
  if (exam && !examByPath(exam)) return notFound(request, locale);
  const topic = request.nextUrl.searchParams.get("topic");
  if (route === "/bank" && topic !== null) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname.replace(/\/bank$/, bankHref({ topic }));
    url.searchParams.delete("topic");
    return NextResponse.redirect(url, 308);
  }
  return contentPages[route]?.(...params) === false
    ? notFound(request, locale)
    : intl(request);
}

export default async function proxy(request: NextRequest) {
  return withTraceTiming(await respond(request));
}

export const config = {
  matcher: "/((?!api|_next|.*/opengraph-image$|.*\\.[a-zA-Z0-9]+$).*)",
};
