import { describe, expect, it } from "vitest";
import { tasks } from "./tasks";

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
