import { withContentCollections } from "@content-collections/next";
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

const legacyPath =
  "(prep|tasks|calculator|diagnostic|cabinet|simulation|history|exams|faculties|training)/:path*";

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId: process.env.GIT_SHA,
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@cortex-js/compute-engine"],
  async redirects() {
    return [
      { source: `/${legacyPath}`, destination: "/", statusCode: 301 },
      { source: `/sr-Latn/${legacyPath}`, destination: "/", statusCode: 301 },
      {
        source: `/:locale(ru|en)/${legacyPath}`,
        destination: "/:locale",
        statusCode: 301,
      },
    ];
  },
};

export default withContentCollections(withNextIntl(nextConfig));
