import { routing } from "@/i18n/routing";

export const routeTemplates = [
  "/",
  "/bank",
  "/bank/[id]",
  "/launch",
  "/privacy",
  "/review",
  "/review/[code]",
  "/stats",
  "/terms",
  "/theory",
  "/theory/[topic]",
  "/theory/[topic]/methods",
  "/theory/[topic]/methods/[method]",
  "/v/[code]",
  "/variants",
  "/variants/[id]",
] as const;

export type RouteTemplate = (typeof routeTemplates)[number] | "/[...rest]";

const localePath = new RegExp(
  `^(?:/(${routing.locales.join("|")})(?=/|$))?(/.*)?$`,
);

const patterns = routeTemplates.map(
  (route) =>
    [route, new RegExp(`^${route.replace(/\[\w+\]/g, "([^/]+)")}$`)] as const,
);

export function routeOf(pathname: string) {
  const [, locale = routing.defaultLocale, path = "/"] =
    localePath.exec(pathname) ?? [];
  const match = patterns
    .map(([route, pattern]) => ({ route, params: pattern.exec(path) }))
    .find(({ params }) => params);
  return {
    locale,
    route: match?.route ?? ("/[...rest]" as const),
    params: match?.params?.slice(1) ?? [],
  };
}
