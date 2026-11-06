"use client";

import { cn } from "cn";
import { ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { isAnswered } from "@/features/tests/state";
import type { VariantTask } from "@/features/variants/variants";
import { queueEvent } from "@/lib/analytics-browser";
import type { LocalTest } from "./test-store";
import { useClock } from "./test-timer";

interface FinishDialogProps {
  test: LocalTest;
  tasks: VariantTask[];
  pending: boolean;
  onFinish: () => void;
  trigger: ReactElement;
  children: ReactNode;
}

const tags = {
  b: (chunks: ReactNode) => <b className="text-foreground">{chunks}</b>,
};

function TimeChip({ test }: { test: LocalTest }) {
  const t = useTranslations("Exam");
  const { over, text } = useClock(test);
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] tabular-nums",
        over
          ? "bg-overtime-tint text-overtime-text"
          : "bg-muted text-muted-foreground",
      )}
    >
      <ClockIcon aria-hidden className="size-3.5" />
      <span className="sr-only">{over ? t("overtime") : t("timeLeft")} </span>
      {text}
    </span>
  );
}

export function FinishDialog({
  test,
  tasks,
  pending,
  onFinish,
  trigger,
  children,
}: FinishDialogProps) {
  const t = useTranslations("Exam");
  const answered = tasks.map((_, i) => isAnswered(test.answers[i] ?? []));
  const done = answered.filter(Boolean).length;

  return (
    <AlertDialog
      onOpenChange={(open) =>
        queueEvent("control_used", {
          control: "finish_dialog",
          value: open ? "opened" : "cancelled",
        })
      }
    >
      <AlertDialogTrigger render={trigger} disabled={pending}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex w-full items-center gap-3">
            <AlertDialogTitle>{t("finishTitle")}</AlertDialogTitle>
            <TimeChip test={test} />
          </div>
          <AlertDialogDescription>
            {t.rich("finishAnswered", { done, total: tasks.length, ...tags })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ol
          aria-hidden="true"
          className="grid grid-cols-5 gap-1.5 md:auto-cols-fr md:grid-flow-col md:grid-cols-none"
        >
          {tasks.map((task, i) => (
            <li
              key={task.taskId}
              className={cn(
                "flex h-10 items-center justify-center rounded-[10px] font-semibold text-[15px] tabular-nums md:h-9 md:text-sm",
                answered[i]
                  ? "bg-lime text-foreground"
                  : "border-[1.5px] border-input border-dashed bg-card text-subtle",
              )}
            >
              {task.number}
            </li>
          ))}
        </ol>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="lime"
            disabled={pending}
            onClick={onFinish}
          >
            {t("finish")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
