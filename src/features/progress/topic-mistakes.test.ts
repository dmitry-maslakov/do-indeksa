import { describe, expect, it } from "vitest";
import { minuteMs } from "@/lib/dates";
import { topicMistakes } from "./topic-mistakes";

const task = (topic: string, wrong: boolean, minutes: number) => ({
  taskId: `${topic}-${minutes}`,
  topic,
  wrong,
  ms: minutes * minuteMs,
});

describe("topicMistakes", () => {
  it("counts the tasks, mistakes and the mean time per topic", () => {
    const [logs] = topicMistakes([
      task("logs", true, 10),
      task("logs", false, 20),
      task("logs", true, 30),
    ]);
    expect(logs).toEqual({
      topic: "logs",
      tasks: 3,
      wrong: 2,
      meanMs: 20 * minuteMs,
    });
  });

  it("puts the topic with the most mistakes first", () => {
    const order = topicMistakes([
      task("trig", true, 1),
      task("logs", true, 2),
      task("logs", true, 3),
      task("sets", false, 4),
      task("vec", true, 5),
      task("vec", false, 6),
    ]).map((t) => t.topic);
    expect(order).toEqual(["logs", "trig", "vec", "sets"]);
  });
});
