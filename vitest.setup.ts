import { createBuilder } from "@content-collections/core";

export const publicContent = ".content-collections/test";

export default async function buildPublicContent() {
  process.env.CONTENT_DIR = "content";
  const builder = await createBuilder("content-collections.ts", {
    configName: "content-collection-config.mjs",
    outputDir: publicContent,
  });
  await builder.build();
}
