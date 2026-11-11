import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { defineCollection, defineConfig } from "@content-collections/core";
import { compact, sumBy, uniqBy } from "es-toolkit";
import { z } from "zod";
import { answerProblem, parseMath } from "./src/features/catalog/checker";
import {
  labelOf,
  markupOf,
  maxParts,
  onlyYesNo,
  partProblem,
  partSchema,
  resultOf,
  statementLetters,
} from "./src/features/catalog/parts";
import { examSource } from "./src/features/catalog/source";
import { symbolNames } from "./src/features/catalog/symbols";
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
    keys: z.array(z.enum(symbolNames)).min(1),
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
    answer: z.string().min(1).optional(),
    check: z.array(partSchema).min(1).max(maxParts),
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
    const invalid = check.find(
      (c) => c.kind !== "yesno" && !parseMath(c.expected).isValid,
    );
    if (invalid) {
      throw new Error(`${origin}: cannot parse expected "${invalid.expected}"`);
    }
    const title = headline(content);
    if (!title) throw new Error(`${origin}: statement must start with words`);
    const rendered = (sources: string[], where: string) =>
      cache(sources, (list) =>
        Promise.all(list.map((source) => renderMarkdown(source, where))).then(
          () => true,
        ),
      );
    const markup = check.map(markupOf);
    if (onlyYesNo(markup)) {
      throw new Error(
        `${origin}: a yes/no part needs a part that justifies it`,
      );
    }
    const letters = statementLetters(content);
    markup.forEach((c, i) => {
      const problem = partProblem(c, letters);
      if (problem) throw new Error(`${origin}: part ${i + 1}: ${problem}`);
      const unsent = answerProblem(c);
      if (unsent)
        throw new Error(
          `${origin}: part ${i + 1}: expected "${c.expected}" ${unsent}`,
        );
    });
    await rendered(compact([content, answer, solution, ...hints]), origin);
    if (!answer) await rendered([resultOf(markup)], `${origin}: result`);
    for (const [i, c] of markup.entries()) {
      const { prefix, suffix, caption } = labelOf(c, i, markup.length);
      await rendered(
        compact([prefix, suffix, caption]),
        `${origin}: part ${i + 1}`,
      );
    }
    return {
      id: task._meta.path,
      ...task,
      text: content,
      excerpt: excerpt(content),
      preview: preview(content),
      headline: title,
      answer: answer ?? null,
      hints,
      solution,
      check: markup,
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

const faculties = defineCollection({
  name: "faculties",
  directory: `${root}/faculties`,
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({
    short: z.string().min(1),
    name: z.string().min(1),
    university: z.string().min(1),
    city: z.string().min(1),
    site: z.url(),
    order: z.number().int(),
  }),
  transform: (faculty) => ({ ...faculty, id: faculty._meta.path }),
});

function checkFaculty(
  id: string,
  all: { _meta: { path: string } }[],
  origin: string,
) {
  if (!all.some((f) => f._meta.path === id)) {
    throw new Error(`${origin}: unknown faculty "${id}"`);
  }
}

const tests = defineCollection({
  name: "tests",
  directory: `${root}/tests`,
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({
    faculty: z.string(),
    subject: z.enum(["math", "physics", "logic"]),
    answers: z.enum(["written", "choice"]),
    minutes: z.number().int().positive(),
    penalty: z.number().min(0).lt(1).default(0),
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
  transform: (test, { documents }) => {
    const origin = test._meta.filePath;
    const { positions } = test;
    checkFaculty(test.faculty, documents(faculties), origin);
    const topicIds = new Set(documents(topics).map((t) => t._meta.path));
    const covered = new Set(documents(tasks).map((t) => t.topic));
    const unknown = positions.find((p) => !topicIds.has(p.topic));
    if (unknown) throw new Error(`${origin}: unknown topic "${unknown.topic}"`);
    const empty = positions.find((p) => !covered.has(p.topic));
    if (empty) throw new Error(`${origin}: no tasks for "${empty.topic}"`);
    const minutes = sumBy(positions, (p) => p.minutes);
    if (minutes !== test.minutes) {
      throw new Error(`${origin}: positions take ${minutes} minutes`);
    }
    return { ...test, id: test._meta.path };
  },
});

const exams = defineCollection({
  name: "exams",
  directory: `${root}/exams`,
  include: "*.yaml",
  parser: "yaml",
  schema: z.object({
    faculty: z.string(),
    title: z.string().min(1),
    tests: z.array(z.string()).min(1),
    points: z.number().int().positive(),
    open: z.boolean().default(false),
    order: z.number().int(),
  }),
  transform: (exam, { documents }) => {
    const origin = exam._meta.filePath;
    const id = exam._meta.path;
    const { faculty } = exam;
    checkFaculty(faculty, documents(faculties), origin);
    if (!id.startsWith(`${faculty}-`)) {
      throw new Error(`${origin}: an exam id starts with "${faculty}-"`);
    }
    const parts = exam.tests.map((testId) => {
      const test = documents(tests).find((t) => t._meta.path === testId);
      if (!test) throw new Error(`${origin}: unknown test "${testId}"`);
      if (test.faculty !== faculty) {
        throw new Error(`${origin}: "${testId}" is not a test of ${faculty}`);
      }
      return test;
    });
    const positions = parts.flatMap((test) => test.positions);
    if (sumBy(positions, (p) => p.points) !== exam.points) {
      throw new Error(`${origin}: the tests do not add up to ${exam.points}`);
    }
    return {
      ...exam,
      id,
      positions: positions.map((p, i) => ({ number: i + 1, ...p })),
      minutes: sumBy(parts, (t) => t.minutes),
    };
  },
});

const pairOf = (path: string) => {
  const [faculty = "", name = ""] = path.split("/");
  return { faculty, name };
};

const programs = defineCollection({
  name: "programs",
  directory: `${root}/programs`,
  include: "*/*.md",
  schema: z.object({
    content: z.string().min(1),
    name: z.string().min(1),
    short: z.string().min(1).optional(),
    level: z.enum(["academic", "applied"]),
    years: z.number().int().positive(),
    espb: z.number().int().positive(),
    exam: z.string(),
    modules: z.array(z.string().min(1)).default([]),
    sources: z.array(z.url()).min(1),
    checked: z.iso.date().optional(),
  }),
  transform: async (program, { documents, cache }) => {
    const origin = program._meta.filePath;
    const { faculty, name: slug } = pairOf(program._meta.path);
    checkFaculty(faculty, documents(faculties), origin);
    const exam = documents(exams).find((e) => e._meta.path === program.exam);
    if (exam?.faculty !== faculty) {
      throw new Error(
        `${origin}: "${program.exam}" is not an exam of ${faculty}`,
      );
    }
    await cache(program.content, (source) =>
      renderMarkdown(source, origin).then(() => true),
    );
    return { ...program, id: program._meta.path, faculty, slug };
  },
});

const admissions = defineCollection({
  name: "admissions",
  directory: `${root}/admissions`,
  include: "*/*.yaml",
  parser: "yaml",
  schema: z.object({
    sources: z.array(z.url()).min(1),
    programs: z.record(
      z.string(),
      z.object({
        budget: z.number().int().nonnegative(),
        self: z.number().int().nonnegative(),
        tuition: z.number().int().positive().optional(),
        cutoff: z
          .object({
            budget: z.number().min(0).max(100).optional(),
            self: z.number().min(0).max(100).optional(),
          })
          .optional(),
      }),
    ),
  }),
  transform: (admission, { documents }) => {
    const origin = admission._meta.filePath;
    const { faculty, name: year } = pairOf(admission._meta.path);
    if (!/^\d{4}$/.test(year)) {
      throw new Error(`${origin}: the file is named after its year`);
    }
    checkFaculty(faculty, documents(faculties), origin);
    const known = new Set(documents(programs).map((p) => p._meta.path));
    const unknown = Object.keys(admission.programs).find(
      (slug) => !known.has(`${faculty}/${slug}`),
    );
    if (unknown) throw new Error(`${origin}: unknown programme "${unknown}"`);
    return {
      ...admission,
      id: admission._meta.path,
      faculty,
      year: Number(year),
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
    test: z.string(),
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
    const test = documents(tests).find((t) => t._meta.path === variant.test);
    if (!test) throw new Error(`${origin}: unknown test "${variant.test}"`);
    const tasksById = new Map(documents(tasks).map((t) => [t._meta.path, t]));
    if (variant.taskIds.length !== test.positions.length) {
      throw new Error(`${origin}: expected ${test.positions.length} tasks`);
    }
    if (new Set(variant.taskIds).size !== variant.taskIds.length) {
      throw new Error(`${origin}: a task is listed twice`);
    }
    variant.taskIds.forEach((taskId, i) => {
      const task = tasksById.get(taskId);
      if (!task) throw new Error(`${origin}: unknown task "${taskId}"`);
      const source = examSource(task.source);
      if (
        variant.kind === "official" &&
        source &&
        (source.year !== variant.year || source.position !== i + 1)
      ) {
        throw new Error(
          `${origin}: "${taskId}" is task ${source.position} of ${source.year}, not ${i + 1}`,
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
    faculties,
    tests,
    exams,
    programs,
    admissions,
    variants,
    theories,
    methods,
    theoryIds,
    methodSlugs,
  ],
});
