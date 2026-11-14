import { withContentCollections } from "@content-collections/next";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { legacyPages } from "./src/lib/legacy-addresses";

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

const temporaryPages = [{ source: "/launch", destination: "/" }];

const localized =
  (statusCode: number) =>
  ({ source, destination, ...match }: (typeof legacyPages)[number]) => [
    { ...match, source, destination, statusCode },
    { ...match, source: `/sr-Latn${source}`, destination, statusCode },
    {
      ...match,
      source: `/:locale(ru|en)${source}`,
      destination: `/:locale${destination}`.replace(/\/$/, ""),
      statusCode,
    },
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
    return [
      ...legacyPages.flatMap(localized(301)),
      ...temporaryPages.flatMap(localized(307)),
    ];
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
