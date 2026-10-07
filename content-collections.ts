import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import { routing } from "./src/i18n/routing";

const localized = z.record(z.enum(routing.locales), z.string().min(1));

const topics = defineCollection({
  name: "topics",
  directory: "content/topics",
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({ name: localized }),
  transform: (topic) => ({ ...topic, id: topic._meta.path }),
});

const exams = defineCollection({
  name: "exams",
  directory: "content/exams",
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({
    faculty: z.string().min(1),
    title: z.string().min(1),
    durationMinutes: z.number().int().positive(),
    positions: z
      .array(
        z.object({
          topic: z.string(),
          points: z.number().int().positive(),
          minutes: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
  transform: ({ _meta, positions, ...exam }, { documents }) => {
    const topicIds = new Set(documents(topics).map((t) => t._meta.path));
    const unknown = positions.find((p) => !topicIds.has(p.topic));
    if (unknown)
      throw new Error(`${_meta.filePath}: unknown topic "${unknown.topic}"`);
    return {
      id: _meta.path,
      ...exam,
      positions: positions.map((p, i) => ({ number: i + 1, ...p })),
      maxPoints: positions.reduce((sum, p) => sum + p.points, 0),
    };
  },
});

export default defineConfig({ content: [topics, exams] });
