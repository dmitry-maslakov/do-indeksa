import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import en from "../../messages/en.json";
import ru from "../../messages/ru.json";
import sr from "../../messages/sr-Latn.json";
import { tasks, taskTitle } from "./tasks";

const messages = { "sr-Latn": sr, ru, en };

const byId = (pick: (t: (typeof tasks)[number]) => string) =>
  Object.fromEntries(tasks.map((t) => [t.id, pick(t)]));

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
        "Razlika dijagonala romba je 14, a stranica je 13. Naći dijagonale, površinu i poluprečnik upisane kružnice.",
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
      "plan-001": "Razlika dijagonala romba je 14, a stranica je 13",
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
