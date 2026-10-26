"use client";

import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { Button } from "@/components/ui/button";
import { phoneBar } from "@/features/tasks/action-bar";
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
    <article className="flex min-w-0 max-w-task flex-1 flex-col pt-4.5 md:pt-3.5">
      <p className="text-[13px] text-subtle">
        {t("meta", {
          number: task.number,
          points: task.points,
          topic: task.topicName,
        })}
      </p>
      <MathHtml
        html={task.statement}
        className="mt-3 overflow-x-auto text-task md:mt-5.5 md:text-xl md:leading-relaxed [&_strong]:font-semibold"
      />
      <div className="mt-5.5 grid gap-3.5 md:mt-8 md:grid-cols-2 md:gap-x-4 md:gap-y-4.5">
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
      <p className="mt-3 text-[13px] text-subtle">{t("introAnswer")}</p>
      <div className="md:mt-8 md:flex md:items-center md:gap-6">
        <div className={phoneBar}>
          <Button
            variant="ghost"
            size="pill"
            disabled={first}
            onClick={onPrev}
            className="flex-1 text-subtle hover:text-foreground md:order-2 md:flex-none md:bg-transparent md:px-0"
          >
            {t("prev")}
          </Button>
          {!last && (
            <Button
              variant="lime"
              size="pill"
              onClick={onNext}
              className="flex-[1.8] md:order-1 md:flex-none"
            >
              <span className="md:hidden">{solve("next")}</span>
              <span className="hidden md:inline">{solve("nextTask")}</span>
              <ArrowRightIcon />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
