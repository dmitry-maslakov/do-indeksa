"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { type ReactNode, Suspense, useRef, useState } from "react";
import { isRight, type PartOutcome } from "@/db/columns";
import type { PartLabel } from "@/features/catalog/parts";
import { checkAnswer, saveSkip } from "@/features/practice/actions";
import { useTaskSession } from "@/features/practice/session/task-session";
import type { TaskStatus } from "@/features/progress/status";
import { StatusIcon } from "@/features/progress/status-icon";
import { queueEvent } from "@/lib/analytics-browser";
import { useErrorText } from "@/lib/use-error-text";
import { ActionBar, type NextTask } from "./action-bar";
import { AnswerField } from "./answer-field";
import { freshInput, latexStats, takeInput } from "./input-stats";
import { type Verdict, verdictOf } from "./verdicts";

interface AnswerFormProps {
  taskId: string;
  parts: PartLabel[];
  unchecked: string[];
  next: Promise<NextTask>;
  fallback: string;
  afterCorrect?: ReactNode;
}

interface Checked {
  outcomes: PartOutcome[];
  correct: boolean;
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
  const stats = useRef(freshInput());
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
  const bar = {
    go: Boolean(checked?.correct) || help.solution,
    fallback,
    onSkip: () =>
      help.track(
        async (sessionId) => (await saveSkip({ taskId, sessionId }))?.data,
      ),
    checked: Boolean(checked),
    disabled:
      isPending || values.every((v) => !v.trim()) || checked?.correct === false,
  };

  return (
    <form
      action={(form) => {
        setEdited(false);
        if (!answerId.current) {
          answerId.current = crypto.randomUUID();
          queueEvent("answer_input", {
            context: "practice",
            task_id: taskId,
            answer_client_id: answerId.current,
            fields: parts.length,
            ...takeInput(stats),
            ...latexStats(values),
          });
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
            stats={stats}
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
        <Suspense fallback={<ActionBar {...bar} />}>
          <ActionBar {...bar} next={next} />
        </Suspense>
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
