import { withContentCollections } from "@content-collections/next";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/sr-Latn.json",
    messages: {
      path: "./messages",
      format: "json",
      locales: "infer",
      precompile: true,
    },
  },
});

const legacyTopics = {
  "kompleksni-brojevi": "complex-numbers",
  "kvadratna-jednacina": "quadratic-equations",
  logaritmi: "logarithms",
  eksponencijalne: "exponential-equations",
  trigonometrija: "trigonometry",
  "vektori-analitika": "vectors-analytic-geometry",
  planimetrija: "plane-geometry",
  stereometrija: "solid-geometry",
  "analiza-funkcije": "functions-integrals",
  kombinatorika: "combinatorics",
};

const legacyPages = [
  { source: "/tasks/:topic/:id", destination: "/bank/:id" },
  ...Object.entries(legacyTopics).map(([slug, topic]) => ({
    source: "/tasks",
    has: [{ type: "query" as const, key: "topic", value: slug }],
    destination: `/bank/topic/${topic}`,
  })),
  { source: "/(tasks|training)/:path*", destination: "/bank" },
  { source: "/exams/:exam(ftn-p1)?", destination: "/variants" },
  { source: "/(diagnostic|simulation)/:path*", destination: "/variants" },
  { source: "/history/:path*", destination: "/variants?tab=history" },
  { source: "/cabinet", destination: "/stats" },
  { source: "/prep", destination: "/" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId: process.env.GIT_SHA,
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: false,
  reactCompiler: { panicThreshold: "all_errors" },
  experimental: { isrFlushToDisk: false },
  serverExternalPackages: ["@cortex-js/compute-engine"],
  async redirects() {
    return legacyPages.flatMap(({ source, destination, ...match }) => [
      { ...match, source, destination, statusCode: 301 },
      { ...match, source: `/sr-Latn${source}`, destination, statusCode: 301 },
      {
        ...match,
        source: `/:locale(ru|en)${source}`,
        destination: `/:locale${destination}`.replace(/\/$/, ""),
        statusCode: 301,
      },
    ]);
  },
};

export default withContentCollections(
  withSentryConfig(withNextIntl(nextConfig), {
    release: { name: process.env.GIT_SHA },
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    tunnelRoute: "/api/monitoring",
    telemetry: false,
    silent: !process.env.CI,
  }),
);
