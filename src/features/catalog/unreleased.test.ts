import { describe, expect, it, vi } from "vitest";
import { getTask, idsByTopic, tasks } from "./tasks";

vi.mock("content-collections", async (importOriginal) => {
  const content = await importOriginal<typeof import("content-collections")>();
  return {
    ...content,
    allVariants: [
      ...content.allVariants,
      {
        ...content.allVariants[0],
        kind: "weekly",
        released: false,
        taskIds: ["eks-002"],
      },
    ],
  };
});

describe("an unreleased week", () => {
  it("keeps its tasks out of the lists but finds them by id", () => {
    expect(tasks.map((t) => t.id)).not.toContain("eks-002");
    expect(idsByTopic.get("exponential-equations")).not.toContain("eks-002");
    expect(getTask("eks-002")?.id).toBe("eks-002");
  });
});
