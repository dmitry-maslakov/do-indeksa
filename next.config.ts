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

const nextConfig: NextConfig = {
  agentRules: false,
};

export default withContentCollections(withNextIntl(nextConfig));
