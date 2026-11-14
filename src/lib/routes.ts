import { routing } from "@/i18n/routing";

const siteTemplates = ["/privacy", "/terms"] as const;

const examTemplates = [
  "/",
  "/bank",
  "/bank/[id]",
  "/bank/topic/[topic]",
  "/bank/topic/[topic]/[page]",
  "/review",
  "/review/[code]",
  "/stats",
  "/theory",
  "/theory/[topic]",
  "/theory/[topic]/methods",
  "/theory/[topic]/methods/[method]",
  "/v/[code]",
  "/variants",
  "/variants/[id]",
  "/variants/[id]/solutions",
] as const;

export const routeTemplates = [...siteTemplates, ...examTemplates] as const;

export type RouteTemplate = (typeof routeTemplates)[number] | "/[...rest]";

const localePath = new RegExp(
  `^(?:/(${routing.locales.join("|")})(?=/|$))?(/.*)?$`,
  "i",
);

const examPath = /^(\/[^/]+\/[^/]+)(\/.*)?$/;

const patternsOf = (templates: readonly RouteTemplate[]) =>
  templates.map(
    (route) =>
      [route, new RegExp(`^${route.replace(/\[\w+\]/g, "([^/]+)")}$`)] as const,
  );

const sitePatterns = patternsOf(["/", ...siteTemplates]);
const examPatterns = patternsOf(examTemplates);

function match(
  patterns: ReturnType<typeof patternsOf>,
  path: string,
): { route: RouteTemplate; params: string[] } | undefined {
  for (const [route, pattern] of patterns) {
    const params = pattern.exec(path);
    if (params) return { route, params: params.slice(1) };
  }
}

const rest = { route: "/[...rest]" as const, params: [] };

export function routeOf(pathname: string) {
  const [, prefix = routing.defaultLocale, path = "/"] =
    localePath.exec(pathname) ?? [];
  const locale =
    routing.locales.find((l) => l.toLowerCase() === prefix.toLowerCase()) ??
    routing.defaultLocale;
  const site = match(sitePatterns, path);
  if (site) return { locale, exam: null, ...site };
  const [, exam = null, within = "/"] = examPath.exec(path) ?? [];
  return {
    locale,
    exam,
    ...((exam && match(examPatterns, within)) || rest),
  };
}
