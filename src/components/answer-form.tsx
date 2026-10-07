"use client";

import { useTranslations } from "next-intl";
import { useActionState, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { type CheckResult, checkAnswer } from "@/server/answers";
import { AnswerField, type AnswerState } from "./answer-field";

interface AnswerFormProps {
  taskId: string;
  labels: (string | null)[];
}

export function AnswerForm({ taskId, labels }: AnswerFormProps) {
  const t = useTranslations("Solve");
  const [result, action, pending] = useActionState<
    CheckResult | null,
    FormData
  >(checkAnswer, null);
  const [startedAt] = useState(() => Date.now());
  const [edited, setEdited] = useState(false);
  const markEdited = useCallback(() => setEdited(true), []);

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
      </div>
    </form>
  );
}
