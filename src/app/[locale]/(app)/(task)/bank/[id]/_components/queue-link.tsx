import { cn } from "cn";
import { useTranslations } from "next-intl";
import { ExamMark } from "@/components/exam-mark";
import { MathHtml } from "@/components/math-html";
import { RailLink } from "@/components/rail";
import type { QueueRow } from "@/features/bank/queue/queue";
import { StatusIcon } from "@/features/progress/status-icon";

const preview = "min-w-0 overflow-hidden whitespace-nowrap mask-r-from-85%";

interface QueueLinkProps {
  task: QueueRow;
  href: string;
  intent: string;
  current: boolean;
  next?: boolean;
}

export function QueueLink({
  task,
  href,
  intent,
  current,
  next,
}: QueueLinkProps) {
  const t = useTranslations("Solve");
  return (
    <RailLink
      href={href}
      data-intent={intent}
      current={current}
      className={cn(
        "min-h-12 items-start py-2 [&>svg]:mt-1",
        next && "opacity-60 hover:opacity-100",
      )}
    >
      <StatusIcon status={next ? undefined : task.status} />
      <span className="flex min-w-0 flex-col">
        <MathHtml as="span" html={task.html} className={preview} />
        <span className="flex flex-wrap items-center gap-x-2 font-normal text-subtle text-xs leading-snug">
          {task.repeat && (
            <span className="rounded-full bg-error-tint px-2 font-medium text-error-text">
              {t("repeat")}
            </span>
          )}
          <span className="min-w-0 max-w-full truncate">{task.topic}</span>
          {task.year && (
            <ExamMark>{t("exam", { year: String(task.year) })}</ExamMark>
          )}
        </span>
      </span>
    </RailLink>
  );
}
