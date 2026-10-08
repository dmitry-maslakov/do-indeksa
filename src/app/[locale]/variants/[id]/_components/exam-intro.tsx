"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ExamTask } from "@/content/variants";
import { TaskLines } from "./task-lines";

interface ExamIntroProps {
  tasks: ExamTask[];
  minutes: number;
  onStart: (timed: boolean) => void;
}

export function ExamIntro({ tasks, minutes, onStart }: ExamIntroProps) {
  const t = useTranslations("Exam");
  const variants = useTranslations("Variants");
  const [timed, setTimed] = useState(true);
  const timerId = useId();

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <Card size="sm" className="gap-4 max-md:order-1">
        <div className="flex items-center justify-between gap-3 px-1 text-sm">
          <label htmlFor={timerId}>{t("timer", { minutes })}</label>
          <Switch id={timerId} checked={timed} onCheckedChange={setTimed} />
        </div>
        <Button className="w-full" onClick={() => onStart(timed)}>
          {variants("start")}
        </Button>
      </Card>
      <Card className="py-3 md:py-4">
        <TaskLines
          tasks={tasks}
          end={(task) => (
            <span className="text-subtle">
              {t("points", { points: task.points })}
            </span>
          )}
        />
      </Card>
    </div>
  );
}
