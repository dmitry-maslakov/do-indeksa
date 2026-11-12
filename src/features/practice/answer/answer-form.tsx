"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { type ReactNode, Suspense, useRef, useState } from "react";
import type { PartOutcome } from "@/db/columns";
import { fieldCount, type RenderedChoice } from "@/features/catalog/choice";
import type { PartLabel } from "@/features/catalog/parts";
import { checkAnswer, saveSkip } from "@/features/practice/actions";
import { useTaskSession } from "@/features/practice/session/task-session";
import { queueEvent } from "@/lib/analytics-browser";
import { useErrorText } from "@/lib/use-error-text";
import { ActionBar, type NextTask } from "./action-bar";
import { AnswerField } from "./answer-field";
import { AnswerStatus } from "./answer-status";
import { ChoiceRetry } from "./choice-retry";
import { ChoiceField, type ChoiceResult } from "./field/choice-field";
import type { FieldState } from "./field/field-frame";
import { freshInput, takeInput, valueStats } from "./input-stats";
import { verdictOf } from "./verdicts";

function choiceView(
  { correct, solved }: { correct: boolean; solved: (string | undefined)[] },
  shown: boolean,
  key: string[],
  values: string[],
  outcomes?: PartOutcome[],
): { value: string[]; result?: ChoiceResult } {
  if (correct)
    return { value: solved.map((text) => text ?? ""), result: "right" };
  if (shown) return { value: key, result: "shown" };
  return { value: values, result: outcomes };
}

interface AnswerFormProps {
  taskId: string;
  parts: PartLabel[];
  choice: RenderedChoice | null;
  unchecked: string[];
  answerValues: string[];
  next: Promise<NextTask>;
  fallback: string;
  afterCorrect?: ReactNode;
}

export function AnswerForm({
  taskId,
  parts,
  choice,
  unchecked,
  answerValues,
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
  const [values, setValues] = useState(() =>
    Array.from({ length: fieldCount({ parts, choice }) }, () => ""),
  );
  const edit = (next: string[]) => {
    setEdited(true);
    answerId.current = null;
    help.note({ typed: next.join("").length });
    setValues(next);
  };

  const checked =
    !edited && result.data && !result.data.sitting ? result.data : undefined;
  const fields = parts.map((part, i) => ({
    part,
    id: `answer-${taskId}-${i}`,
  }));
  const grid = parts.length >= 2 && parts.every((p) => !p.caption);
  const filled = help.shown !== undefined;
  const { solved } = help;
  const fillOf = (i: number) =>
    solved[i] ?? (filled ? answerValues[i] : undefined);
  const stateOf = (i: number): FieldState => {
    if (solved[i] !== undefined) return "right";
    if (fillOf(i) !== undefined) return "shown";
    return checked?.outcomes[i] ?? "empty";
  };
  const view = choiceView(
    help,
    filled,
    answerValues,
    values,
    checked?.outcomes,
  );
  const bar = {
    go: help.correct || filled,
    fallback,
    onSkip: () => {
      const recorded = help.recorded();
      const skip = help.track(
        async (sessionId) => (await saveSkip({ taskId, sessionId }))?.data,
      );
      return recorded ? undefined : skip;
    },
    checked: Boolean(checked),
    disabled:
      isPending || values.every((v) => !v.trim()) || checked?.correct === false,
  };

  return (
    <form
      action={(form) => {
        if (!answerId.current) {
          answerId.current = crypto.randomUUID();
          queueEvent("answer_input", {
            context: "practice",
            task_id: taskId,
            answer_client_id: answerId.current,
            fields: values.length,
            ...valueStats({ parts, choice }, values),
            ...takeInput(stats),
          });
        }
        form.set("clientId", answerId.current);
        const sent = form.getAll("answer").map(String);
        help.track(async (sessionId) => {
          if (sessionId) form.set("sessionId", sessionId);
          const data = (await executeAsync(form))?.data;
          setEdited(false);
          if (!data) return;
          if (data.sitting) {
            help.restore(data.sitting);
            return;
          }
          help.note({ verdict: verdictOf(data.outcomes) });
          help.solve(data.outcomes, sent);
          return data.sessionId;
        });
      }}
      className="mt-6 flex max-w-task flex-col gap-4 md:mt-8"
    >
      <input type="hidden" name="taskId" value={taskId} />
      {choice ? (
        <ChoiceField
          id={`answer-${taskId}`}
          choice={choice}
          variant="solve"
          value={view.value}
          result={view.result}
          locked={help.correct || filled}
          stats={stats}
          onChange={edit}
        />
      ) : (
        <div
          className={cn(
            "flex flex-col gap-4",
            grid && "md:grid md:grid-cols-2",
          )}
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
              problem={checked?.problems[i]}
              locked={solved[i] !== undefined || filled}
              fill={fillOf(i)}
              stats={stats}
              onChange={(index, value) => edit(values.with(index, value))}
            />
          ))}
        </div>
      )}
      {unchecked.length > 0 && (
        <p className="-mt-1 text-subtle text-xs">
          {t("unchecked", { parts: unchecked.join(", ") })}
        </p>
      )}
      <AnswerStatus
        outcomes={checked?.outcomes}
        solved={
          choice
            ? Number(help.correct)
            : solved.filter((text) => text !== undefined).length
        }
        total={choice ? 1 : parts.length}
        note={
          choice &&
          checked?.correct === false && (
            <ChoiceRetry
              choice={choice}
              value={values}
              outcomes={checked.outcomes}
            />
          )
        }
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
