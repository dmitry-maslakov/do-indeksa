"use client";

import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnswerField } from "@/features/tasks/answer-field";
import type { ExamTask as Task } from "./variants";

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
  const ids = task.parts.map((_, i) => `answer-${task.id}-${i}`);

  return (
    <Card className="gap-6 md:p-9">
      <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
        <Badge variant="tint" className="max-w-full whitespace-normal">
          {task.topicName}
        </Badge>
        <span>{t("meta", { number: task.number, points: task.points })}</span>
      </div>
      <MathHtml
        html={task.statement}
        className="font-semibold text-lg tracking-tight md:text-task-lg"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {task.parts.map((part, i) => (
          <AnswerField
            key={ids[i]}
            id={ids[i] ?? task.id}
            index={i}
            name="answer"
            label={
              task.parts.length === 1
                ? solve("yourAnswer")
                : solve("answerPart", { number: i + 1 })
            }
            part={part}
            variant="exam"
            defaultValue={answers[i]}
            onChange={onAnswer}
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
