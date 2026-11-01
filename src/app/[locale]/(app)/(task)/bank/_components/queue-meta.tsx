import { cn } from "cn";
import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ExamMark } from "@/components/exam-mark";
import type { QueueRow } from "@/features/bank/queue/queue";
import { statusTones } from "@/features/progress/status-icon";
import { type RowState, resultOf } from "./queue-mark";

function Part({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center not-first:before:mr-1.5 not-first:before:content-['·']",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function QueueMeta({
  task,
  state,
}: {
  task: QueueRow;
  state: RowState;
}) {
  const t = useTranslations("Solve");
  const bank = useTranslations("Bank");
  const upcoming = state === "next" || state === "later";
  const result = resultOf(task, state);

  return (
    <span className="mt-0.5 flex min-h-4 min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-subtle text-xs leading-4">
      {state === "current" && (
        <Part className="font-semibold text-foreground">{t("current")}</Part>
      )}
      {state === "next" && (
        <Part className="font-medium text-foreground">{t("upNext")}</Part>
      )}
      {result && (
        <Part className={statusTones[result]}>
          {t("status", { status: result })}
        </Part>
      )}
      {task.repeat && !result && (
        <Part className="gap-0.5 text-progress-text">
          <RotateCcwIcon aria-hidden className="size-3 stroke-[2.4]" />
          {t("repeat")}
        </Part>
      )}
      {task.year && (
        <Part>
          <ExamMark>{t("exam", { year: String(task.year) })}</ExamMark>
        </Part>
      )}
      {upcoming && <Part>{bank("taskLevel", { level: task.level })}</Part>}
    </span>
  );
}
