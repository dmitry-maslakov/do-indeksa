"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ExamTask } from "@/content/variants";
import { Link } from "@/i18n/navigation";
import { TaskLines } from "./task-lines";

interface ExamIntroProps {
  tasks: ExamTask[];
  minutes: number;
  swaps?: (string | undefined)[];
  onStart: (timed: boolean) => void;
}

export function ExamIntro({ tasks, minutes, swaps, onStart }: ExamIntroProps) {
  const t = useTranslations("Exam");
  const variants = useTranslations("Variants");
  const [timed, setTimed] = useState(true);
  const timerId = useId();
  const swappable = swaps?.some(Boolean);

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
          end={(task, i) => {
            const href = swaps?.[i];
            return (
              <>
                <span className="text-subtle">
                  {t("points", { points: task.points })}
                </span>
                {href ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="-my-1.5 bg-transparent text-subtle hover:bg-muted hover:text-foreground"
                    aria-label={t("swap", { number: task.number })}
                    render={<Link href={href} replace scroll={false} />}
                    nativeButton={false}
                  >
                    <RefreshCwIcon />
                  </Button>
                ) : (
                  swappable && <span className="w-9" />
                )}
              </>
            );
          }}
        />
      </Card>
    </div>
  );
}
