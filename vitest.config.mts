import { defineConfig } from "vitest/config";
import { publicContent } from "./vitest.setup";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": new URL(
        "node_modules/server-only/empty.js",
        import.meta.url,
      ).pathname,
      "content-collections": new URL(
        `${publicContent}/index.js`,
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    dir: "src",
    globalSetup: "vitest.setup.ts",
    server: { deps: { inline: ["next-intl"] } },
  },
});
