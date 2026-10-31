import { describe, expect, it } from "vitest";
import { dayMs } from "@/lib/dates";
import { defaultPolicy } from "../../policy";
import { start as now } from "../../status/observations.fixture";
import type { TopicSignal } from "../contracts";
import { learningOf } from "../learning.fixture";
import { finishTopic } from "./finish-topic";
import { keepGoing } from "./keep-going";
import { keepInShape } from "./keep-in-shape";
import { review } from "./review";
import { startNext } from "./start-next";
import { stuck } from "./stuck";
import { switchTopic } from "./switch-topic";

const scores = (
  signal: TopicSignal,
  topics: Parameters<typeof learningOf>[0],
  policy = defaultPolicy,
) =>
  Object.keys(topics).filter(
    (topic) =>
      signal.score(
        { topic },
        {
          learning: learningOf(topics),
          candidates: [],
          picked: [],
          policy,
          now,
        },
      ) > 0,
  );

describe("stuck", () => {
  it("fires at four fails in a row", () => {
    expect(
      scores(stuck, {
        a: { state: "warming", failStreak: 3 },
        b: { state: "warming", failStreak: 4 },
      }),
    ).toEqual(["b"]);
  });

  it("reads the streak from the policy", () => {
    expect(
      scores(
        stuck,
        { a: { state: "warming", failStreak: 2 } },
        {
          ...defaultPolicy,
          stuckAfter: 2,
        },
      ),
    ).toEqual(["a"]);
  });
});

describe("review", () => {
  it("fires for a topic in review", () => {
    expect(
      scores(review, { a: { state: "mastered" }, b: { state: "review" } }),
    ).toEqual(["b"]);
  });
});

describe("finishTopic", () => {
  it("fires for a topic that is almost mastered", () => {
    expect(
      scores(finishTopic, {
        a: { state: "inProgress" },
        b: { state: "inProgress", almost: true },
      }),
    ).toEqual(["b"]);
  });
});

describe("keepGoing", () => {
  it("keeps the last practiced topic under six tasks today", () => {
    expect(
      scores(keepGoing, {
        a: { state: "inProgress", lastAt: 1 },
        b: { state: "warming", lastAt: 2, tasksToday: 5 },
      }),
    ).toEqual(["b"]);
  });

  it("stops at six tasks today", () => {
    expect(
      scores(keepGoing, { a: { state: "warming", lastAt: 2, tasksToday: 6 } }),
    ).toEqual([]);
  });

  it("leaves a mastered topic", () => {
    expect(scores(keepGoing, { a: { state: "mastered", lastAt: 2 } })).toEqual(
      [],
    );
  });
});

describe("switchTopic", () => {
  it("moves to the other open topics after six tasks today", () => {
    expect(
      scores(switchTopic, {
        a: { state: "inProgress", lastAt: 2, tasksToday: 6 },
        b: { state: "mastered", lastAt: 1 },
        c: { state: "warming", lastAt: 1 },
        d: { state: "notStarted" },
      }),
    ).toEqual(["c"]);
  });

  it("stays quiet under six tasks today", () => {
    expect(
      scores(switchTopic, {
        a: { state: "inProgress", lastAt: 2, tasksToday: 5 },
        b: { state: "warming", lastAt: 1 },
      }),
    ).toEqual([]);
  });

  it("stays quiet before any practice", () => {
    expect(scores(switchTopic, { a: {}, b: {} })).toEqual([]);
  });
});

describe("startNext", () => {
  it("starts the first topic not started", () => {
    expect(
      scores(startNext, {
        a: { state: "mastered" },
        b: { state: "warming" },
        c: {},
        d: {},
      }),
    ).toEqual(["c"]);
  });

  it("waits while three topics are open", () => {
    const open = {
      a: { state: "warming" as const },
      b: { state: "inProgress" as const },
      c: { state: "review" as const },
      d: {},
    };
    expect(scores(startNext, open)).toEqual(["d"]);
    expect(scores(startNext, { ...open, c: { state: "warming" } })).toEqual([]);
  });
});

describe("keepInShape", () => {
  it("fires for a mastered topic untouched for a week", () => {
    expect(
      scores(keepInShape, {
        a: { state: "mastered", lastAt: now - 6 * dayMs },
        b: { state: "mastered", lastAt: now - 7 * dayMs },
        c: { state: "inProgress", lastAt: now - 8 * dayMs },
      }),
    ).toEqual(["b"]);
  });
});
