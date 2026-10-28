import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { defineCollection, defineConfig } from "@content-collections/core";
import { uniqBy } from "es-toolkit";
import { z } from "zod";
import { parseMath } from "./src/features/catalog/checker";
import { hasBareTex, maxParts, splitLabel } from "./src/features/catalog/parts";
import { tones, topicIconSchema } from "./src/features/catalog/topic-look";
import { images, sections, theoryMarkdown } from "./src/features/theory/blocks";
import { routing } from "./src/i18n/routing";
import { excerpt, headline, preview, renderMarkdown } from "./src/lib/markdown";

const keyRevOf = (expected: string[]) =>
  createHash("sha256")
    .update(JSON.stringify(expected))
    .digest("hex")
    .slice(0, 12);

const root = process.env.CONTENT_DIR ?? "content";

const localized = z.record(z.enum(routing.locales), z.string().min(1));

const topics = defineCollection({
  name: "topics",
  directory: `${root}/topics`,
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({
    name: localized,
    icon: topicIconSchema,
    tone: z.enum(tones),
    types: z.array(z.string().regex(/^[a-z]+(-[a-z]+)*$/)).min(1),
  }),
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
        z.object({
          label: z
            .string()
            .refine((label) => !hasBareTex(label), "TeX outside $…$")
            .optional(),
          expected: z.string().min(1),
        }),
      )
      .min(1)
      .max(maxParts),
    hints: z.array(z.string().min(1)).max(3).default([]),
    solution: z.string().min(1),
    type: z.string().min(1),
  }),
  transform: async (
    { content, answer, check, hints, solution, ...task },
    { documents, cache },
  ) => {
    const origin = task._meta.filePath;
    const topic = documents(topics).find((t) => t._meta.path === task.topic);
    if (!topic) throw new Error(`${origin}: unknown topic "${task.topic}"`);
    if (!topic.types.includes(task.type)) {
      throw new Error(`${origin}: unknown type "${task.type}"`);
    }
    const invalid = check.find((c) => !parseMath(c.expected).isValid);
    if (invalid) {
      throw new Error(`${origin}: cannot parse expected "${invalid.expected}"`);
    }
    const title = headline(content);
    if (!title) throw new Error(`${origin}: statement must start with words`);
    const render = (source: string) => renderMarkdown(source, origin);
    await cache(
      [
        content,
        answer,
        solution,
        ...hints,
        ...check.flatMap((c, i, all) => {
          const { prefix, caption } = splitLabel(
            c.label ?? null,
            i,
            all.length,
          );
          return [prefix ?? "", caption ?? ""];
        }),
      ],
      (sources) => Promise.all(sources.map(render)).then(() => true),
    );
    return {
      id: task._meta.path,
      ...task,
      text: content,
      excerpt: excerpt(content),
      preview: preview(content),
      headline: title,
      answer,
      hints,
      solution,
      check: check.map(({ label, expected }) => ({
        expected,
        label: label ?? null,
      })),
      keyRev: keyRevOf(check.map((c) => c.expected)),
    };
  },
});

const taskIds = defineCollection({
  name: "taskIds",
  directory: `${root}/tasks`,
  include: "*.md",
  schema: z.object({ content: z.string() }),
  transform: (task) => ({ id: task._meta.path }),
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

function weekOf(id: string, origin: string) {
  const week = /^nedelja-(\d{4}-\d{2}-\d{2})$/.exec(id)?.[1];
  if (!week || new Date(`${week}T00:00:00Z`).getUTCDay() !== 1) {
    throw new Error(`${origin}: a weekly variant is named nedelja-<Monday>`);
  }
  return week;
}

const variants = defineCollection({
  name: "variants",
  directory: `${root}/variants`,
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({
    exam: z.string(),
    kind: z.enum(["official", "curated", "weekly"]),
    year: z.number().int().optional(),
    title: z.string().optional(),
    original: z.url().optional(),
    released: z.boolean().default(false),
    taskIds: z.array(z.string()).min(1),
  }),
  transform: (variant, { documents }) => {
    const origin = variant._meta.filePath;
    const id = variant._meta.path;
    const week = variant.kind === "weekly" ? weekOf(id, origin) : undefined;
    const exam = documents(exams).find((e) => e._meta.path === variant.exam);
    if (!exam) throw new Error(`${origin}: unknown exam "${variant.exam}"`);
    const tasksById = new Map(documents(tasks).map((t) => [t._meta.path, t]));
    if (variant.taskIds.length !== exam.positions.length) {
      throw new Error(`${origin}: expected ${exam.positions.length} tasks`);
    }
    variant.taskIds.forEach((taskId, i) => {
      const task = tasksById.get(taskId);
      if (!task) throw new Error(`${origin}: unknown task "${taskId}"`);
      if (task.topic !== exam.positions[i]?.topic) {
        throw new Error(
          `${origin}: "${taskId}" does not fit position ${i + 1}`,
        );
      }
      if (week && taskId !== `${id}-${String(i + 1).padStart(2, "0")}`) {
        throw new Error(`${origin}: task ${i + 1} is named ${id}-NN`);
      }
      if (week && task.difficulty < 3) {
        throw new Error(`${origin}: "${taskId}" is easier than difficulty 3`);
      }
    });
    const title = variant.title ?? variant.year?.toString();
    if (!title) throw new Error(`${origin}: needs a title or a year`);
    return { ...variant, id, title, week };
  },
});

const theoryRoot = `${root}/theory`;

async function inline(url: string, directory: string, origin: string) {
  if (!url.endsWith(".svg"))
    throw new Error(`${origin}: "${url}" is not an svg`);
  const svg = await readFile(path.join(theoryRoot, directory, url));
  return [url, `data:image/svg+xml;base64,${svg.toString("base64")}`] as const;
}

const theories = defineCollection({
  name: "theories",
  directory: theoryRoot,
  include: "*/index.md",
  schema: z.object({ content: z.string().min(1) }),
  transform: async (theory, { documents, cache }) => {
    const { content, _meta } = theory;
    const origin = _meta.filePath;
    const topic = _meta.directory;
    if (!documents(topics).some((t) => t._meta.path === topic)) {
      throw new Error(`${origin}: unknown topic "${topic}"`);
    }
    await cache(content, (source) =>
      renderMarkdown(source, origin, theoryMarkdown).then(() => true),
    );
    const parts = sections(content);
    if (uniqBy(parts, (p) => p.id).length !== parts.length) {
      throw new Error(`${origin}: section titles must differ`);
    }
    const files = await Promise.all(
      images(content).map((url) => inline(url, topic, origin)),
    );
    return {
      ...theory,
      topic,
      sections: parts,
      images: Object.fromEntries(files),
    };
  },
});

const methodParts = (path: string) => {
  const [topic = "", , slug = ""] = path.split("/");
  return { topic, slug };
};

const methods = defineCollection({
  name: "methods",
  directory: theoryRoot,
  include: "*/methods/*.md",
  schema: z.object({
    name: z.string().min(1),
    when: z.string().min(1),
    order: z.number().int(),
    content: z.string().min(1),
  }),
  transform: async (method, { documents, cache }) => {
    const origin = method._meta.filePath;
    const { topic, slug } = methodParts(method._meta.path);
    if (!documents(theories).some((t) => t._meta.directory === topic)) {
      throw new Error(`${origin}: no theory for topic "${topic}"`);
    }
    await cache([method.name, method.when], (sources) =>
      Promise.all(sources.map((s) => renderMarkdown(s, origin))).then(
        () => true,
      ),
    );
    await cache(method.content, (source) =>
      renderMarkdown(source, origin, theoryMarkdown).then(() => true),
    );
    return { ...method, topic, slug };
  },
});

const theoryIds = defineCollection({
  name: "theoryIds",
  directory: theoryRoot,
  include: "*/index.md",
  schema: z.object({ content: z.string() }),
  transform: (theory) => ({ id: theory._meta.directory }),
});

const methodSlugs = defineCollection({
  name: "methodSlugs",
  directory: theoryRoot,
  include: "*/methods/*.md",
  schema: z.object({ content: z.string() }),
  transform: (method) => methodParts(method._meta.path),
});

export default defineConfig({
  content: [
    topics,
    tasks,
    taskIds,
    exams,
    variants,
    theories,
    methods,
    theoryIds,
    methodSlugs,
  ],
});
