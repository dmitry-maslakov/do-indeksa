import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { defaultPolicy } from "../../policy";
import type { TaskHistory } from "../../state";
import { start as now } from "../../status/observations.fixture";
import type { Candidate } from "../contracts";
import { abilityAt, candidate, history, learningAt } from "../learning.fixture";
import { maxRepeats } from "./max-repeats";
import { repeatLevelCap } from "./repeat-level-cap";

const levelOne = abilityAt(1);

const context = (
  tasks: Record<string, TaskHistory>,
  picked: Candidate[] = [],
  ability = levelOne,
  policy = defaultPolicy,
) => ({ learning: learningAt(ability, [], tasks), picked, policy, now });

const fresh = (n: number) =>
  Array.from({ length: n }, (_, i) => candidate(`new${i}`, 1));

describe("maxRepeats", () => {
  const due = { r1: history(), r2: history(), r3: history() };
  const r = (id: string) => candidate(id, 1);

  it("lets a new task in whatever was picked", () => {
    expect(maxRepeats.allows(r("new"), context(due, [r("r1"), r("r2")]))).toBe(
      true,
    );
  });

  it("allows two repeats in every six tasks", () => {
    expect(maxRepeats.allows(r("r3"), context(due, [r("r1")]))).toBe(true);
    expect(
      maxRepeats.allows(r("r3"), context(due, [r("r1"), ...fresh(3), r("r2")])),
    ).toBe(false);
    expect(
      maxRepeats.allows(r("r3"), context(due, [r("r1"), ...fresh(4), r("r2")])),
    ).toBe(true);
  });

  it("counts a task tried again today as a repeat", () => {
    const tasks = { ...due, again: history({ tries: 2, dueAt: now + dayMs }) };
    expect(
      maxRepeats.allows(r("r3"), context(tasks, [r("again"), r("r1")])),
    ).toBe(false);
    const once = { ...due, once: history({ dueAt: now + dayMs }) };
    expect(
      maxRepeats.allows(r("r3"), context(once, [r("once"), r("r1")])),
    ).toBe(true);
  });
});

describe("repeatLevelCap", () => {
  const stretch = candidate("hard", 3);

  it("keeps a repeat within one level above the topic's level", () => {
    const tasks = {
      easy: history({ difficulty: 2 }),
      hard: history({ difficulty: 3 }),
    };
    expect(repeatLevelCap.allows(candidate("easy", 2), context(tasks))).toBe(
      true,
    );
    expect(repeatLevelCap.allows(stretch, context(tasks))).toBe(false);
  });

  it("doesn't cap a new task", () => {
    expect(repeatLevelCap.allows(candidate("new", 4), context({}))).toBe(true);
  });

  it("goes two or three levels up when nothing nearer is due in the topic", () => {
    const tasks = {
      hard: history({ difficulty: 3 }),
      hardest: history({ difficulty: 4 }),
      later: history({ difficulty: 2, dueAt: now + dayMs }),
      elsewhere: history({ topic: "limits", difficulty: 1 }),
    };
    expect(repeatLevelCap.allows(stretch, context(tasks))).toBe(true);
    expect(repeatLevelCap.allows(candidate("hardest", 4), context(tasks))).toBe(
      true,
    );
    expect(
      repeatLevelCap.allows(
        candidate("hardest", 4),
        context(tasks, [], levelOne, {
          ...defaultPolicy,
          stretchLevelsAbove: 2,
        }),
      ),
    ).toBe(false);
  });

  it("goes up once a nearer due task is picked", () => {
    const tasks = {
      near: history({ difficulty: 1 }),
      hard: history({ difficulty: 3 }),
    };
    expect(repeatLevelCap.allows(stretch, context(tasks))).toBe(false);
    expect(
      repeatLevelCap.allows(stretch, context(tasks, [candidate("near", 1)])),
    ).toBe(true);
  });

  it("goes up at most once a day per topic", () => {
    const tasks = {
      hard: history({ difficulty: 3 }),
      done: history({ difficulty: 4, tries: 2, dueAt: now + dayMs }),
    };
    expect(
      repeatLevelCap.allows(stretch, context(tasks, [candidate("done", 4)])),
    ).toBe(false);
    expect(
      repeatLevelCap.allows(stretch, context(tasks, [candidate("new", 4)])),
    ).toBe(true);
  });
});
