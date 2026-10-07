import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import { renderMarkdown } from "./src/content/markdown";
import { routing } from "./src/i18n/routing";
import { parseMath } from "./src/lib/math";

const localized = z.record(z.enum(routing.locales), z.string().min(1));

const topics = defineCollection({
  name: "topics",
  directory: "content/topics",
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({ name: localized }),
  transform: (topic) => ({ ...topic, id: topic._meta.path }),
});

const tasks = defineCollection({
  name: "tasks",
  directory: "content/tasks",
  include: "*.md",
  schema: z.object({
    content: z.string().min(1),
    topic: z.string(),
    difficulty: z.number().int().min(1).max(5),
    source: z.string().min(1),
    answer: z.string().min(1),
    check: z
      .array(
        z.object({ label: z.string().optional(), expected: z.string().min(1) }),
      )
      .min(1)
      .max(6),
    hints: z.array(z.string().min(1)).max(3).default([]),
    solution: z.string().min(1),
  }),
  transform: async (
    { _meta, content, answer, check, hints, solution, ...task },
    { documents },
  ) => {
    const origin = _meta.filePath;
    if (!documents(topics).some((t) => t._meta.path === task.topic)) {
      throw new Error(`${origin}: unknown topic "${task.topic}"`);
    }
    const invalid = check.find((c) => !parseMath(c.expected).isValid);
    if (invalid) {
      throw new Error(`${origin}: cannot parse expected "${invalid.expected}"`);
    }
    const render = (source: string) => renderMarkdown(source, origin);
    return {
      id: _meta.path,
      ...task,
      statement: await render(content),
      answer: await render(answer),
      hints: await Promise.all(hints.map(render)),
      solution: await render(solution),
      check: await Promise.all(
        check.map(async ({ label, expected }) => ({
          expected,
          label: label ? await render(label) : null,
        })),
      ),
    };
  },
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
    const covered = new Set(documents(tasks).map((t) => t.topic));
    const unknown = positions.find((p) => !topicIds.has(p.topic));
    if (unknown)
      throw new Error(`${_meta.filePath}: unknown topic "${unknown.topic}"`);
    const empty = positions.find((p) => !covered.has(p.topic));
    if (empty)
      throw new Error(`${_meta.filePath}: no tasks for "${empty.topic}"`);
    return {
      id: _meta.path,
      ...exam,
      positions: positions.map((p, i) => ({ number: i + 1, ...p })),
      maxPoints: positions.reduce((sum, p) => sum + p.points, 0),
    };
  },
});

export default defineConfig({ content: [topics, tasks, exams] });
