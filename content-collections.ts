import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import { routing } from "./src/i18n/routing";
import { renderMarkdown } from "./src/lib/markdown";
import { parseMath } from "./src/lib/math";

const root = process.env.CONTENT_DIR ?? "content";

const localized = z.record(z.enum(routing.locales), z.string().min(1));

const topics = defineCollection({
  name: "topics",
  directory: `${root}/topics`,
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({ name: localized }),
  transform: (topic) => ({ ...topic, id: topic._meta.path }),
});

const tasks = defineCollection({
  name: "tasks",
  directory: `${root}/tasks`,
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
    { content, answer, check, hints, solution, ...task },
    { documents },
  ) => {
    const origin = task._meta.filePath;
    if (!documents(topics).some((t) => t._meta.path === task.topic)) {
      throw new Error(`${origin}: unknown topic "${task.topic}"`);
    }
    const invalid = check.find((c) => !parseMath(c.expected).isValid);
    if (invalid) {
      throw new Error(`${origin}: cannot parse expected "${invalid.expected}"`);
    }
    const render = (source: string) => renderMarkdown(source, origin);
    return {
      id: task._meta.path,
      ...task,
      text: content,
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
  directory: `${root}/exams`,
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
    daily: z.object({ size: z.number().int().positive() }).default({ size: 5 }),
  }),
  transform: ({ positions, ...exam }, { documents }) => {
    const topicIds = new Set(documents(topics).map((t) => t._meta.path));
    const covered = new Set(documents(tasks).map((t) => t.topic));
    const unknown = positions.find((p) => !topicIds.has(p.topic));
    if (unknown)
      throw new Error(
        `${exam._meta.filePath}: unknown topic "${unknown.topic}"`,
      );
    const empty = positions.find((p) => !covered.has(p.topic));
    if (empty)
      throw new Error(`${exam._meta.filePath}: no tasks for "${empty.topic}"`);
    return {
      id: exam._meta.path,
      ...exam,
      positions: positions.map((p, i) => ({ number: i + 1, ...p })),
      maxPoints: positions.reduce((sum, p) => sum + p.points, 0),
    };
  },
});

const variants = defineCollection({
  name: "variants",
  directory: `${root}/variants`,
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({
    exam: z.string(),
    kind: z.enum(["official", "curated"]),
    year: z.number().int().optional(),
    title: z.string().optional(),
    taskIds: z.array(z.string()).min(1),
  }),
  transform: (variant, { documents }) => {
    const origin = variant._meta.filePath;
    const exam = documents(exams).find((e) => e._meta.path === variant.exam);
    if (!exam) throw new Error(`${origin}: unknown exam "${variant.exam}"`);
    const tasksById = new Map(documents(tasks).map((t) => [t._meta.path, t]));
    if (variant.taskIds.length !== exam.positions.length) {
      throw new Error(`${origin}: expected ${exam.positions.length} tasks`);
    }
    variant.taskIds.forEach((id, i) => {
      const task = tasksById.get(id);
      if (!task) throw new Error(`${origin}: unknown task "${id}"`);
      if (task.topic !== exam.positions[i]?.topic) {
        throw new Error(`${origin}: "${id}" does not fit position ${i + 1}`);
      }
    });
    const title = variant.title ?? variant.year?.toString();
    if (!title) throw new Error(`${origin}: needs a title or a year`);
    return { ...variant, id: variant._meta.path, title };
  },
});

export default defineConfig({ content: [topics, tasks, exams, variants] });
