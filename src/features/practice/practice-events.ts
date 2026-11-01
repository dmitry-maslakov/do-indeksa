import { z } from "zod";
import { partOutcomes, reportKinds, sessionKinds } from "@/db/columns";
import { revealPart, testKind } from "@/db/schema";
import { kinds } from "@/features/catalog/kinds";
import { levels } from "@/features/catalog/level";
import { maxParts } from "@/features/catalog/parts";
import { defineEvent, type EventMap, text } from "@/lib/analytics-schema";
import { structureKinds } from "./answer/input-stats";
import { verdicts } from "./answer/verdicts";

const count = z.int().min(0);

const answered = {
  context: z.enum(["practice", "test"]),
  test_session_id: z.uuid().optional(),
  position: z.int().positive().optional(),
};

export const placements = [
  "home_hero",
  "topic_row",
  "bank_tab",
  "topic_select",
  "rail_upcoming",
  "rail_visit",
  "rail_earlier",
  "next",
  "skip",
  "card",
  "review_row",
] as const;

export const taskIntent = z.object({
  via: z.enum(["picker", "list", "search", "review", "history"]),
  placement: z.enum(placements).optional(),
  rank: z.int().min(1).max(10_000).optional(),
});

const task = {
  task_id: text,
  topic: text,
  task_type: text,
  difficulty: z.int().min(1).max(5),
  level: z.enum(levels),
  exam_year: z.int().positive().optional(),
  exam_position: z.int().positive().optional(),
  key_rev: text,
  hints_available: z.int().min(0).max(3),
  parts: z.int().min(1).max(maxParts),
};

const session = {
  task_session_id: z.uuid(),
  session_kind: z.enum(sessionKinds),
  attempts_before: count,
  last_verdict: z.enum(["none", ...verdicts]),
  hints_before: count,
  solution_before: z.boolean(),
  answer_before: z.boolean(),
  since_open_ms: count,
};

export const taskOpened = defineEvent("task_opened", {
  ...task,
  task_session_id: session.task_session_id,
  session_kind: session.session_kind,
  ...taskIntent.shape,
  via: z.enum([...taskIntent.shape.via.options, "direct"]),
  status_before: z.enum(["new", "solved", "wrong"]),
});

export const taskResumed = defineEvent("task_resumed", {
  task_id: text,
  task_session_id: z.uuid(),
  previous_task_session_id: z.uuid(),
});

const answerInput = defineEvent("answer_input", {
  ...answered,
  task_id: text,
  answer_client_id: z.uuid().optional(),
  fields: z.int().min(1).max(maxParts),
  kinds: z.array(z.enum(kinds)).max(maxParts).optional(),
  boxes: count.optional(),
  inputs: count,
  deletes: count,
  pastes: count,
  vk_inputs: count,
  vk_toggles: count.optional(),
  text_mode: z.boolean().optional(),
  field_ready_ms: count.optional(),
  first_focus_ms: count.optional(),
  focus_to_submit_ms: count.optional(),
  edit_ms: count.optional(),
  latex_len: count,
  structures: z
    .array(z.enum(structureKinds))
    .max(structureKinds.length)
    .optional(),
});

export const answerSubmitted = defineEvent("answer_submitted", {
  ...task,
  ...session,
  ...answered,
  answer_client_id: z.uuid(),
  correct: z.boolean(),
  verdict: z.enum(verdicts),
  outcomes: z.array(z.enum(partOutcomes)).min(1).max(maxParts),
  checker: z.int().min(1),
  variant_kind: z.enum(testKind.enumValues).optional(),
  duration_ms: count.optional(),
  visits: count.optional(),
});

export const helpRevealed = defineEvent("help_revealed", {
  ...task,
  ...session,
  context: z.enum(["practice", "review"]),
  part: z.enum(revealPart.enumValues),
  test_session_id: z.uuid().optional(),
});

export const taskSkipped = defineEvent("task_skipped", { ...task, ...session });

const taskLeft = defineEvent("task_left", {
  task_id: text,
  task_session_id: z.uuid().optional(),
  seq: z.int().min(1),
  exit: z.enum(["navigate", "hidden", "pagehide"]),
  state: z.enum([
    "untouched",
    "typing",
    "revealed",
    "solved",
    "wrong",
    "unreadable",
    "incomplete",
  ]),
  visible_ms: count,
  typed_len: count,
  field_ready_ms: count.optional(),
});

export const taskReported = defineEvent("task_reported", {
  ...task,
  kind: z.enum(reportKinds),
  has_message: z.boolean(),
  message_len: count,
});

export const clientEvents = [answerInput, taskLeft] as const;

declare module "@/lib/analytics-browser" {
  interface BrowserEvents extends EventMap<typeof clientEvents> {}
}
