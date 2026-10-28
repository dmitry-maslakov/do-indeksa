import { describe, expect, it } from "vitest";
import { testDraft } from "./columns";

const visit = (task: number) => ({
  id: crypto.randomUUID(),
  task,
  startedAt: 0,
  endedAt: 1,
});

describe("testDraft", () => {
  const draft = testDraft({ tasks: 3, parts: 2 });
  const accepts = (value: unknown) => draft.safeParse(value).success;

  it("takes as many tasks and parts as the limits allow", () => {
    expect(
      accepts({
        answers: [["1", "2"], [], ["3"]],
        visits: [visit(0), visit(2)],
      }),
    ).toBe(true);
  });

  it("rejects more tasks than the exam has", () => {
    expect(accepts({ answers: [[], [], [], []], visits: [] })).toBe(false);
  });

  it("rejects more parts than the limit", () => {
    expect(accepts({ answers: [["1", "2", "3"]], visits: [] })).toBe(false);
  });

  it("rejects a visit to a task the exam does not have", () => {
    expect(accepts({ answers: [], visits: [visit(3)] })).toBe(false);
  });
});
