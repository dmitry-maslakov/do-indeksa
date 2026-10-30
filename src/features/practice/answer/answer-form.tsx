"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { type ReactNode, useRef, useState } from "react";
import { isRight, type PartOutcome } from "@/db/columns";
import type { PartLabel } from "@/features/catalog/parts";
import { checkAnswer, saveSkip } from "@/features/practice/actions";
import { useTaskSession } from "@/features/practice/session/task-session";
import type { TaskStatus } from "@/features/progress/status";
import { StatusIcon } from "@/features/progress/status-icon";
import { queueEvent } from "@/lib/analytics-browser";
import { useErrorText } from "@/lib/use-error-text";
import { ActionBar } from "./action-bar";
import { AnswerField } from "./answer-field";
import { type Verdict, verdictOf } from "./verdicts";

interface AnswerFormProps {
  taskId: string;
  parts: PartLabel[];
  unchecked: string[];
  next?: string;
  fallback: string;
  afterCorrect?: ReactNode;
}

interface Checked {
  outcomes: PartOutcome[];
  correct: boolean;
}

interface InputStats {
  focusAt?: number;
  inputs: number;
  deletes: number;
  pastes: number;
  vk_inputs: number;
}

const freshInput = (): InputStats => ({
  inputs: 0,
  deletes: 0,
  pastes: 0,
  vk_inputs: 0,
});

function focused(input: InputStats) {
  input.focusAt ??= performance.now();
}

function countInput(
  input: InputStats,
  { inputType, data, isComposing }: InputEvent,
) {
  if (isComposing || inputType === "insertCompositionText") return;
  const type = inputType || data || "";
  focused(input);
  input.inputs += 1;
  if (type.startsWith("delete")) input.deletes += 1;
  if (type === "insertFromPaste") input.pastes += 1;
  if (window.mathVirtualKeyboard?.visible) input.vk_inputs += 1;
}

const verdicts: Record<Verdict, { look: string; status?: TaskStatus }> = {
  correct: { look: "text-success-text", status: "solved" },
  wrong: { look: "text-error-text", status: "wrong" },
  unreadable: { look: "text-overtime-text" },
  incomplete: { look: "text-overtime-text" },
};

function Result({ checked: { outcomes } }: { checked: Checked }) {
  const t = useTranslations("Solve");
  const verdict = verdictOf(outcomes);
  const { look, status } = verdicts[verdict];
  return (
    <span
      role="status"
      className={cn(
        "order-3 flex items-center gap-2 font-semibold text-base",
        look,
      )}
    >
      {status && <StatusIcon status={status} className="size-5" />}
      {t(verdict)}
      {verdict === "wrong" && outcomes.length > 1 && (
        <small className="font-normal text-muted-foreground text-sm">
          {t("partsRight", {
            right: outcomes.filter(isRight).length,
            total: outcomes.length,
          })}
        </small>
      )}
    </span>
  );
}

export function AnswerForm({
  taskId,
  parts,
  unchecked,
  next,
  fallback,
  afterCorrect,
}: AnswerFormProps) {
  const t = useTranslations("Solve");
  const { executeAsync, result, isPending, hasErrored } =
    useAction(checkAnswer);
  const errorText = useErrorText();
  const help = useTaskSession();
  const [edited, setEdited] = useState(false);
  const answerId = useRef<string | null>(null);
  const input = useRef(freshInput());
  const [values, setValues] = useState(() => parts.map(() => ""));
  const onChange = (index: number, value: string) => {
    setEdited(true);
    answerId.current = null;
    help.note({ typed: values.with(index, value).join("").length });
    setValues((all) => all.with(index, value));
  };

  const checked = edited ? undefined : result.data;
  const fields = parts.map((part, i) => ({
    part,
    id: `answer-${taskId}-${i}`,
  }));
  const grid = parts.length >= 2 && parts.every((p) => !p.caption);
  const stateOf = (i: number): PartOutcome => checked?.outcomes[i] ?? "empty";

  return (
    <form
      onFocus={() => focused(input.current)}
      onInput={(event) =>
        countInput(input.current, event.nativeEvent as InputEvent)
      }
      action={(form) => {
        setEdited(false);
        if (!answerId.current) {
          answerId.current = crypto.randomUUID();
          const { focusAt, ...counts } = input.current;
          queueEvent("answer_input", {
            context: "practice",
            task_id: taskId,
            answer_client_id: answerId.current,
            fields: parts.length,
            ...counts,
            focus_to_submit_ms:
              focusAt === undefined
                ? undefined
                : Math.round(performance.now() - focusAt),
            latex_len: values.join("").length,
          });
          input.current = freshInput();
        }
        form.set("clientId", answerId.current);
        help.track(async (sessionId) => {
          if (sessionId) form.set("sessionId", sessionId);
          const data = (await executeAsync(form))?.data;
          if (data) help.note({ verdict: verdictOf(data.outcomes) });
          return data?.sessionId;
        });
      }}
      className="mt-6 flex max-w-task flex-col gap-4 md:mt-8"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <div
        className={cn("flex flex-col gap-4", grid && "md:grid md:grid-cols-2")}
      >
        {fields.map(({ part, id }, i) => (
          <AnswerField
            key={id}
            id={id}
            index={i}
            name="answer"
            label={
              parts.length === 1
                ? t("yourAnswer")
                : t("answerPart", { number: i + 1 })
            }
            part={part}
            variant="solve"
            placeholder={
              part.letter || part.prefix
                ? undefined
                : `\\text{${t("placeholder")}}`
            }
            state={stateOf(i)}
            onChange={onChange}
          />
        ))}
      </div>
      {unchecked.length > 0 && (
        <p className="-mt-1 text-subtle text-xs">
          {t("unchecked", { parts: unchecked.join(", ") })}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3">
        <ActionBar
          go={Boolean(checked?.correct) || help.solution}
          next={next ?? fallback}
          skip={next}
          onSkip={() =>
            help.track(
              async (sessionId) =>
                (await saveSkip({ taskId, sessionId }))?.data,
            )
          }
          checked={Boolean(checked)}
          disabled={
            isPending ||
            values.every((v) => !v.trim()) ||
            checked?.correct === false
          }
        />
        {hasErrored && (
          <span role="alert" className="text-error-text">
            {errorText()}
          </span>
        )}
        {checked && <Result checked={checked} />}
      </div>
      {checked?.correct && afterCorrect}
    </form>
  );
}
