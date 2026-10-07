"use client";

import { useTranslations } from "next-intl";
import { useActionState, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { type CheckResult, checkAnswer } from "@/server/answers";
import { AnswerField, type AnswerState } from "./answer-field";
import { useHints } from "./hints";

interface AnswerFormProps {
  taskId: string;
  labels: (string | null)[];
  skip?: string;
}

export function AnswerForm({ taskId, labels, skip }: AnswerFormProps) {
  const t = useTranslations("Solve");
  const [result, action, pending] = useActionState<
    CheckResult | null,
    FormData
  >(checkAnswer, null);
  const [startedAt] = useState(() => Date.now());
  const [edited, setEdited] = useState(false);
  const markEdited = useCallback(() => setEdited(true), []);
  const hints = useHints();

  const stateOf = (i: number): AnswerState =>
    !result || edited ? "empty" : result.parts[i] ? "correct" : "wrong";

  return (
    <form
      action={(form) => {
        setEdited(false);
        action(form);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="startedAt" value={startedAt} />
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
        <Button type="submit" disabled={pending}>
          {t("check")}
        </Button>
        {result && !edited && (
          <span
            role="status"
            className={result.correct ? "text-success-text" : "text-error-text"}
          >
            {result.correct ? t("correct") : t("wrong")}
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
