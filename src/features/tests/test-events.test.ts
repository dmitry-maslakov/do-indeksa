import { describe, expect, it } from "vitest";
import { clientEvents, testFinished } from "./test-events";

const testSessionId = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const nextTestSessionId = "7a2d3b9f-4c5e-4f60-9b0c-1d2e3f4a5b6c";
const facts = {
  test_session_id: testSessionId,
  variant_id: "ftn-p1-2025",
  variant_kind: "official",
  tasks: 10,
  minutes: 240,
};

const valid = {
  test_started: {
    ...facts,
    via: "review",
    placement: "similar",
    fallback: "weak",
  },
  test_resumed: { ...facts, from: "server", away_ms: 3600, answered: 2 },
  test_task_viewed: {
    test_session_id: testSessionId,
    variant_kind: "custom",
    position: 4,
    task_id: "eks-001",
    visit_no: 2,
    nav: "rail",
    prev_position: 1,
    prev_dwell_ms: 52_000,
    answered: 1,
    elapsed_ms: 90_000,
  },
  test_task_swapped: {
    test_session_id: testSessionId,
    to_test_session_id: nextTestSessionId,
    position: 4,
    from_task_id: "eks-001",
    to_task_id: "eks-002",
  },
  test_left: {
    test_session_id: testSessionId,
    position: 3,
    answered: 2,
    elapsed_ms: 600_000,
    over: false,
    exit: "hidden",
    seq: 1,
  },
  variant_compose_started: {
    mode: "topics",
    preset: "weak",
    topics: ["eks", "log"],
    size: 5,
  },
  result_shared: { variant_id: "set-eks-001", method: "clipboard", ok: true },
};

const invalid = {
  test_started: { ...facts, via: "catalog", variant_kind: "daily" },
  test_resumed: { ...facts, from: "cloud", away_ms: 0, answered: 0 },
  test_task_viewed: { ...valid.test_task_viewed, position: 0 },
  test_task_swapped: { ...valid.test_task_swapped, test_session_id: "1" },
  test_left: { ...valid.test_left, exit: "close" },
  variant_compose_started: { mode: "exam", preset: "all", size: 0 },
  result_shared: { variant_id: "ftn-p1-2025", method: "email", ok: true },
};

const schemaOf = (name: string) =>
  clientEvents.find((event) => event.name === name)?.props;

describe("test events", () => {
  it.each(Object.entries(valid))("accepts %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(true);
  });

  it.each(Object.entries(invalid))("rejects a bad %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(false);
  });

  it("counts a duration skewed by the clock as zero", () => {
    expect(
      schemaOf("test_resumed")?.parse({ ...valid.test_resumed, away_ms: -40 }),
    ).toMatchObject({ away_ms: 0 });
  });

  it("counts a test started from an unknown place as direct", () => {
    const started = { ...facts, via: "picker", placement: "home_hero" };
    expect(schemaOf("test_started")?.parse(started)).toEqual({
      ...facts,
      via: "direct",
    });
    expect(schemaOf("test_started")?.parse(facts)).toMatchObject({
      via: "direct",
    });
  });

  it("covers every client event", () => {
    expect(clientEvents.map(({ name }) => name).toSorted()).toEqual(
      Object.keys(valid).toSorted(),
    );
  });

  it("accepts a finished test and rejects a negative score", () => {
    const finished = {
      ...facts,
      weekly: false,
      answered: 1,
      correct: 0,
      score: 0,
      max_points: 60,
      elapsed_ms: 900_000,
      overtime: false,
      unanswered: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      visits: 3,
      positions_visited: 2,
    };
    expect(testFinished.props.safeParse(finished).success).toBe(true);
    expect(
      testFinished.props.safeParse({ ...finished, score: -1 }).success,
    ).toBe(false);
  });

  it("never uses OpenPanel's reserved keys", () => {
    const keys = [...clientEvents, testFinished].flatMap(({ props }) =>
      Object.keys(props.shape),
    );
    expect(keys.filter((key) => key.startsWith("__"))).toEqual([]);
  });
});
