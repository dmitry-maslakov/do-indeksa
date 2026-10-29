"use client";

import { cn } from "cn";
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
import type { LocalTest } from "./test-store";

interface FinishDialogProps {
  test: LocalTest;
  tasks: VariantTask[];
  pending: boolean;
  onFinish: () => void;
  trigger: ReactElement;
  children: ReactNode;
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
  const left = answered.filter((done) => !done).length;

  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} disabled={pending}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-semibold text-lg">
            {t("finishTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {left > 0 ? t("finishLeft", { count: left }) : t("finishAll")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ol
          aria-hidden="true"
          className="grid auto-cols-fr grid-flow-col gap-1"
        >
          {tasks.map((task, i) => (
            <li
              key={task.taskId}
              className={cn(
                "flex h-8 items-center justify-center rounded-lg font-semibold text-sm tabular-nums",
                answered[i]
                  ? "bg-data text-primary-foreground"
                  : "bg-muted text-subtle",
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
