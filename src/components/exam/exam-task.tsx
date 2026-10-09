"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AnswerField } from "@/components/answer-field";
import { MathHtml } from "@/components/math-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ExamTask as Task } from "@/content/variants";

interface ExamTaskProps {
  task: Task;
  answers: string[];
  first: boolean;
  last: boolean;
  onAnswer: (part: number, value: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ExamTask({
  task,
  answers,
  first,
  last,
  onAnswer,
  onPrev,
  onNext,
}: ExamTaskProps) {
  const t = useTranslations("Exam");
  const solve = useTranslations("Solve");
  const fields = useMemo(
    () =>
      task.labels.map((labelHtml, i) => ({
        labelHtml,
        onEdit: (value: string) => onAnswer(i, value),
      })),
    [task, onAnswer],
  );

  return (
    <Card className="gap-6 md:p-9">
      <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
        <Badge variant="tint">{task.topicName}</Badge>
        <span>{t("meta", { number: task.number, points: task.points })}</span>
      </div>
      <MathHtml
        html={task.statement}
        className="font-semibold text-lg tracking-tight md:text-task-lg"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(({ labelHtml, onEdit }, i) => (
          <AnswerField
            key={`${task.id}-${labelHtml ?? i}`}
            name="answer"
            label={
              task.labels.length === 1
                ? solve("yourAnswer")
                : solve("answerPart", { number: i + 1 })
            }
            labelHtml={labelHtml}
            state="empty"
            defaultValue={answers[i]}
            onEdit={onEdit}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" disabled={first} onClick={onPrev}>
          {t("prev")}
        </Button>
        {!last && <Button onClick={onNext}>{t("next")}</Button>}
      </div>
    </Card>
  );
}
