"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { type ReactNode, Suspense, useRef, useState } from "react";
import { isRight } from "@/db/columns";
import type { PartLabel } from "@/features/catalog/parts";
import { checkAnswer, saveSkip } from "@/features/practice/actions";
import { useReveal } from "@/features/practice/reveal/use-reveal";
import { useTaskSession } from "@/features/practice/session/task-session";
import { queueEvent } from "@/lib/analytics-browser";
import { useErrorText } from "@/lib/use-error-text";
import { ActionBar, type NextTask } from "./action-bar";
import { AnswerField, type FieldState } from "./answer-field";
import { AnswerStatus } from "./answer-status";
import { freshInput, latexStats, takeInput } from "./input-stats";
import { verdictOf } from "./verdicts";

interface AnswerFormProps {
  taskId: string;
  parts: PartLabel[];
  unchecked: string[];
  next: Promise<NextTask>;
  fallback: string;
  afterCorrect?: ReactNode;
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
  const { data: reveal } = useReveal(taskId, help.shown);
  const [solved, setSolved] = useState(() => parts.map(() => false));
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
  const filled = help.shown !== undefined;
  const fillOf = (i: number) => (solved[i] ? undefined : reveal?.values[i]);
  const stateOf = (i: number): FieldState => {
    if (solved[i]) return "right";
    if (fillOf(i) !== undefined) return "shown";
    return checked?.outcomes[i] ?? "empty";
  };
  const bar = {
    go: help.correct || filled,
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
          if (data) {
            help.note({ verdict: verdictOf(data.outcomes) });
            setSolved(data.outcomes.map(isRight));
            if (data.correct) help.markCorrect();
          }
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
            locked={solved[i] || filled}
            fill={fillOf(i)}
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
      <AnswerStatus
        taskId={taskId}
        answerText={unchecked.length > 0}
        outcomes={checked?.outcomes}
        solved={solved.filter(Boolean).length}
        total={parts.length}
      />
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Suspense fallback={<ActionBar {...bar} />}>
          <ActionBar {...bar} next={next} />
        </Suspense>
        {hasErrored && (
          <span role="alert" className="text-error-text">
            {errorText()}
          </span>
        )}
      </div>
      {checked?.correct && afterCorrect}
    </form>
  );
}
