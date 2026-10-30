import { describe, expect, it } from "vitest";
import { taskFacts, tasks } from "@/features/catalog/tasks";
import {
  answerSubmitted,
  clientEvents,
  helpRevealed,
  taskIntent,
  taskOpened,
  taskReported,
  taskResumed,
  taskSkipped,
} from "./practice-events";

const id = "6f1d3c1e-2a51-4c36-9a5e-3b1e0e6b4b8a";
const task = {
  task_id: "eks-001",
  topic: "exponential-equations",
  task_type: "substitution",
  difficulty: 1,
  level: "easy",
  key_rev: "a1b2c3",
  hints_available: 2,
  parts: 1,
};
const session = {
  task_session_id: id,
  session_kind: "first",
  attempts_before: 1,
  last_verdict: "wrong",
  hints_before: 1,
  solution_before: false,
  answer_before: false,
  since_open_ms: 41_000,
};

const events = [
  ...clientEvents,
  taskOpened,
  taskResumed,
  answerSubmitted,
  helpRevealed,
  taskSkipped,
  taskReported,
];

const schemaOf = (name: string) =>
  events.find((event) => event.name === name)?.props;

const valid = {
  task_opened: {
    ...task,
    exam_year: 2019,
    exam_position: 3,
    task_session_id: id,
    session_kind: "retry",
    via: "list",
    placement: "card",
    rank: 3,
    status_before: "wrong",
  },
  task_resumed: {
    task_id: "eks-001",
    task_session_id: id,
    previous_task_session_id: id,
  },
  answer_input: {
    context: "practice",
    task_id: "eks-001",
    answer_client_id: id,
    fields: 2,
    inputs: 14,
    deletes: 2,
    pastes: 0,
    vk_inputs: 9,
    vk_toggles: 2,
    text_mode: false,
    field_ready_ms: 640,
    first_focus_ms: 3_200,
    focus_to_submit_ms: 21_500,
    edit_ms: 9_800,
    latex_len: 11,
    structures: ["frac", "interval"],
  },
  answer_submitted: {
    ...task,
    ...session,
    context: "practice",
    answer_client_id: id,
    correct: false,
    verdict: "unreadable",
    outcomes: ["right", "unreadable"],
    checker: 1,
  },
  help_revealed: {
    ...task,
    ...session,
    context: "review",
    part: "hint2",
    test_session_id: id,
  },
  task_skipped: {
    ...task,
    ...session,
    attempts_before: 0,
    last_verdict: "none",
  },
  task_left: {
    task_id: "eks-001",
    task_session_id: id,
    seq: 2,
    exit: "hidden",
    state: "typing",
    visible_ms: 64_000,
    typed_len: 5,
    field_ready_ms: 900,
  },
  task_reported: {
    ...task,
    kind: "answer",
    has_message: true,
    message_len: 42,
  },
};

const invalid = {
  task_opened: { ...valid.task_opened, via: "home" },
  task_resumed: { task_id: "eks-001", task_session_id: id },
  answer_input: { ...valid.answer_input, answer: "x=2" },
  answer_submitted: { ...valid.answer_submitted, verdict: "partial" },
  help_revealed: { ...valid.help_revealed, part: "hint4" },
  task_skipped: { ...task, ...session, attempts_before: -1 },
  task_left: { ...valid.task_left, seq: 0 },
  task_reported: { ...valid.task_reported, message: "Pogrešan ključ" },
};

describe("practice events", () => {
  it.each(Object.entries(valid))("accepts %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(true);
  });

  it.each(Object.entries(invalid))("rejects a bad %s", (name, props) => {
    expect(schemaOf(name)?.safeParse(props).success).toBe(false);
  });

  it.each(["answer_input", "answer_submitted"])(
    "accepts %s given in a test and rejects one in a review",
    (name) => {
      const props = valid[name as keyof typeof valid];
      const test = { context: "test", test_session_id: id, position: 4 };
      expect(schemaOf(name)?.safeParse({ ...props, ...test }).success).toBe(
        true,
      );
      expect(
        schemaOf(name)?.safeParse({ ...props, context: "review" }).success,
      ).toBe(false);
    },
  );

  it("accepts the facts of every task", () => {
    const rejected = tasks.filter(
      ({ id }) =>
        !taskSkipped.props.safeParse({ ...taskFacts(id), ...session }).success,
    );
    expect(rejected.map(({ id }) => id)).toEqual([]);
  });

  it("never uses OpenPanel's reserved keys", () => {
    const keys = events.flatMap(({ props }) => Object.keys(props.shape));
    expect(keys.filter((key) => key.startsWith("__"))).toEqual([]);
  });
});

describe("intents", () => {
  it("takes what a rail link carries", () => {
    const intent = { via: "picker", placement: "rail_upcoming", rank: 2 };
    expect(taskIntent.parse(intent)).toEqual(intent);
  });

  it.each([
    ["an unknown via", { via: "home" }],
    ["an unknown placement", { via: "picker", placement: "hero" }],
    ["a rank below one", { via: "list", placement: "card", rank: 0 }],
  ])("rejects %s", (_, intent) => {
    expect(taskIntent.safeParse(intent).success).toBe(false);
  });
});
