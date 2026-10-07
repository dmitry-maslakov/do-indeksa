import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": new URL(
        "node_modules/server-only/empty.js",
        import.meta.url,
      ).pathname,
    },
  },
  test: { dir: "src" },
});
