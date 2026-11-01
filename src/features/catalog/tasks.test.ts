import type { Task } from "content-collections";
import { createTranslator } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { routing } from "@/i18n/routing";
import { renderMarkdown } from "@/lib/markdown";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";
import sr from "../../../messages/sr-Latn.json";
import {
  getTask,
  idsByTopic,
  renderStatement,
  summarize,
  taskIdSchema,
  tasks,
  taskTitle,
  typesByTopic,
} from "./tasks";

vi.mock("@/lib/markdown", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/markdown")>();
  return { ...actual, renderMarkdown: vi.fn(actual.renderMarkdown) };
});

const messages = { "sr-Latn": sr, ru, en };

const byId = (pick: (t: (typeof tasks)[number]) => string) =>
  Object.fromEntries(tasks.map((t) => [t.id, pick(t)]));

describe("task index", () => {
  it("finds every task by id", () => {
    for (const task of tasks) expect(getTask(task.id)).toBe(task);
    expect(getTask("nema-takvog")).toBeUndefined();
  });

  it("accepts only known task ids", () => {
    for (const task of tasks) {
      expect(taskIdSchema.safeParse(task.id).success).toBe(true);
    }
    expect(taskIdSchema.safeParse("nema-takvog").success).toBe(false);
    expect(taskIdSchema.safeParse(1).success).toBe(false);
  });

  it("groups task ids by topic", () => {
    for (const [topic, ids] of idsByTopic) {
      for (const id of ids) expect(getTask(id)?.topic).toBe(topic);
    }
    expect([...idsByTopic.values()].flat().sort()).toEqual(
      tasks.map((t) => t.id).sort(),
    );
  });

  it("lists each topic's types once, from the tasks it serves", () => {
    expect(typesByTopic.get("exponential-equations")).toEqual(["substitution"]);
    expect(typesByTopic.get("trigonometry")).toEqual(["roots-in-interval"]);
    expect([...typesByTopic.keys()].sort()).toEqual(
      [...idsByTopic.keys()].sort(),
    );
  });
});

describe("task statements", () => {
  it("render once and then come from the cache", async () => {
    for (const task of tasks.slice(0, 3)) {
      vi.mocked(renderMarkdown).mockClear();
      const html = await renderStatement(task);
      expect(html).toMatch(/^</);
      expect(await renderStatement(task)).toBe(html);
      expect(renderMarkdown).toHaveBeenCalledTimes(1);
    }
  });
});

describe("task excerpts", () => {
  it.each(tasks.map((t) => [t.id, t.excerpt]))("%s has no LaTeX", (_, text) => {
    expect(text).toBeTruthy();
    expect(text).not.toMatch(/[\\$^_{}]/);
    expect(text.length).toBeLessThanOrEqual(160);
  });

  it("keeps the words and plain numbers of the statements", () => {
    expect(byId((t) => t.excerpt)).toMatchObject({
      "eks-001": "Rešiti jednačinu…",
      "kb-003":
        "Dat je kompleksan broj. Odrediti njegov moduo, glavni argument…",
      "kv-002": "Data je jednačina…",
      "log-001": "Rešiti jednačinu…",
      "plan-001":
        "Razlika dijagonala romba je 14 cm, a stranica je 13 cm. Naći dijagonale, površinu i poluprečnik upisane kružnice.",
      "trig-001": "Naći sva rešenja jednačine…",
      "vek-002":
        "U prostoru su date tačke A(1,1,1), B(-1,2,2) i C(0,0,3). a) Naći ugao…",
    });
  });
});

describe("task titles", () => {
  it("take the first sentence of the statement", () => {
    expect(byId((t) => t.headline)).toMatchObject({
      "eks-001": "Rešiti jednačinu",
      "fun-002": "Data je funkcija…",
      "kb-003": "Dat je kompleksan broj",
      "komb-002": "Od cifara skupa…",
      "kv-002": "Data je jednačina…",
      "plan-001": "Razlika dijagonala romba je 14 cm, a stranica je 13 cm",
      "ster-001":
        "Data je kocka kod koje je površina (brojno) jednaka zapremini",
      "trig-001": "Naći sva rešenja jednačine",
    });
  });

  it.each(routing.locales)("are short and unique in %s", (locale) => {
    const meta = createTranslator({
      locale,
      messages: messages[locale],
      namespace: "Metadata",
    });
    const titles = tasks.map((t) => taskTitle(t, locale, meta));
    for (const title of titles) {
      expect(title.length).toBeLessThanOrEqual(60);
      expect(title).not.toMatch(/[\\$^_{}]/);
    }
    expect(new Set(titles).size).toBe(tasks.length);
  });
});

describe("task numbers", () => {
  const taskOn = (topic: string) => ({ id: "t", topic, difficulty: 2 }) as Task;

  it("take the exam position of the topic", () => {
    expect(summarize(taskOn("logarithms")).number).toBe(3);
  });

  it("are missing for topics outside the exam", () => {
    expect(summarize(taskOn("sequences")).number).toBeNull();
  });
});
