"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useErrorText } from "@/lib/use-error-text";
import { checkAnswer } from "./answer-action";
import { AnswerField, type AnswerState } from "./answer-field";
import { useHints } from "./hints";

interface AnswerFormProps {
  taskId: string;
  labels: (string | null)[];
  skip?: string;
}

export function AnswerForm({ taskId, labels, skip }: AnswerFormProps) {
  const t = useTranslations("Solve");
  const { execute, result, isPending, hasErrored } = useAction(checkAnswer);
  const errorText = useErrorText();
  const checked = result.data;
  const startedAt = useRef(0);
  const [edited, setEdited] = useState(false);
  const markEdited = useCallback(() => setEdited(true), []);
  const hints = useHints();

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const stateOf = (i: number): AnswerState =>
    !checked || edited ? "empty" : checked.parts[i] ? "correct" : "wrong";

  return (
    <form
      action={(form) => {
        setEdited(false);
        form.set("startedAt", String(startedAt.current));
        execute(form);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="hintsUsed" value={hints?.used ?? 0} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {labels.map((labelHtml, i) => (
          <AnswerField
            key={labelHtml ?? i}
            name="answer"
            label={
              labels.length === 1
                ? t("yourAnswer")
                : t("answerPart", { number: i + 1 })
            }
            labelHtml={labelHtml}
            state={stateOf(i)}
            onEdit={markEdited}
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {t("check")}
        </Button>
        {hasErrored && (
          <span role="alert" className="text-error-text">
            {errorText(result.serverError)}
          </span>
        )}
        {checked && !edited && (
          <span
            role="status"
            className={
              checked.correct ? "text-success-text" : "text-error-text"
            }
          >
            {checked.correct ? t("correct") : t("wrong")}
          </span>
        )}
        {skip && (
          <Link
            href={skip}
            className="ml-auto text-[15px] text-subtle hover:text-foreground"
          >
            {t("skip")}
          </Link>
        )}
      </div>
    </form>
  );
}
