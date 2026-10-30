import { describe, expect, it, vi } from "vitest";
import { numberOf } from "./exams";
import { taskFacts } from "./tasks";

vi.mock("content-collections", async (importOriginal) => {
  const content = await importOriginal<typeof import("content-collections")>();
  const [task] = content.allTasks;
  return {
    ...content,
    allTasks: [
      ...content.allTasks,
      {
        ...task,
        id: "from-exam",
        difficulty: 4,
        source: "Prijemni 2019, zadatak 3",
      },
      { ...task, id: "our-own", difficulty: 2, source: "Do indeksa" },
    ],
  };
});

describe("task facts", () => {
  it("place an exam task where it stood in that exam", () => {
    expect(taskFacts("from-exam")).toMatchObject({
      level: "hard",
      exam_year: 2019,
      exam_position: 3,
    });
  });

  it("place our own task at the position of its topic", () => {
    const facts = taskFacts("our-own");
    expect(facts).toMatchObject({
      level: "easy",
      exam_year: undefined,
      exam_position: numberOf(facts.topic) ?? undefined,
    });
  });
});
