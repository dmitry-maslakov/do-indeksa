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

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId: process.env.GIT_SHA,
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: false,
  reactCompiler: { panicThreshold: "all_errors" },
  experimental: { isrFlushToDisk: false },
  serverExternalPackages: ["@cortex-js/compute-engine"],
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "header", key: "next-router-segment-prefetch" }],
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
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
