"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { RailButton, RailContent, RailHeading } from "@/components/rail";
import { Button } from "@/components/ui/button";
import type { LocalTest } from "./exam-store";
import { ExamTimer } from "./exam-timer";
import { FinishDialog } from "./finish-dialog";
import { answeredCount, isAnswered } from "./test-state";
import type { ExamTask } from "./variants";

interface ExamRailProps {
  test: LocalTest;
  code?: string;
  tasks: ExamTask[];
  pending: boolean;
  onGo: (index: number) => void;
  onFinish: () => void;
}

export function ExamRail({
  test,
  code,
  tasks,
  pending,
  onGo,
  onFinish,
}: ExamRailProps) {
  const t = useTranslations("Exam");
  const variants = useTranslations("Variants");
  const done = answeredCount(test);

  return (
    <RailContent>
      <div className="flex flex-col gap-4.5 px-5 pb-3">
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold">{test.title}</span>
          {code && (
            <span className="text-subtle text-xs">
              {variants("code", { code })}
            </span>
          )}
        </span>
        <ExamTimer timing={test} />
      </div>
      <nav
        aria-label={t("tasks")}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5"
      >
        <RailHeading>{t("tasks")}</RailHeading>
        {tasks.map((task, i) => {
          const answered = isAnswered(test.answers[i] ?? []);
          const current = i === test.current;
          return (
            <RailButton
              key={task.id}
              current={current}
              onClick={() => onGo(i)}
              className="h-10 shrink-0 items-center gap-2.5 px-3"
            >
              <span
                className={cn(
                  "size-3.5 shrink-0 rounded-full",
                  answered
                    ? "bg-foreground"
                    : "border-[1.5px] border-subtle/50",
                )}
              />
              <span className="w-4.5 font-semibold tabular-nums">
                {task.number}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  !answered && !current && "text-muted-foreground",
                )}
              >
                {task.topicName}
              </span>
            </RailButton>
          );
        })}
      </nav>
      <div className="flex flex-col gap-2.5 px-3 pt-4.5 pb-3.5">
        <span className="px-2.5 text-[13px] text-muted-foreground tabular-nums">
          {t("answered", { count: done, total: tasks.length })}
        </span>
        <FinishDialog
          left={tasks.length - done}
          pending={pending}
          onFinish={onFinish}
          trigger={
            <Button variant="ghost" className="h-11.5 rounded-xl bg-card" />
          }
        >
          {t("finish")}
        </FinishDialog>
      </div>
    </RailContent>
  );
}
