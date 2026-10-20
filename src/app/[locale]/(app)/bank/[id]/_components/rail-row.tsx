import { cn } from "cn";
import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import type { QueueRow } from "@/features/bank/queue";
import type { ListRow } from "@/features/bank/rail-page";
import { StatusIcon } from "@/features/progress/status-icon";
import { Link } from "@/i18n/navigation";
import { ExamMark } from "./task-meta";

export const rowHeight = 40;

const row =
  "flex w-full gap-2 rounded-lg px-2 text-left text-sm outline-none hover:bg-untouched focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-card aria-[current=page]:font-semibold group-data-[variant=sheet]/rail:aria-[current=page]:bg-muted aria-[current=page]:shadow-current";
const preview = "min-w-0 overflow-hidden whitespace-nowrap mask-r-from-85%";

interface QueueLinkProps {
  task: QueueRow;
  href: string;
  current: boolean;
  next?: boolean;
}

export function QueueLink({ task, href, current, next }: QueueLinkProps) {
  const t = useTranslations("Solve");
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        row,
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
          {task.year && <ExamMark year={task.year} />}
        </span>
      </span>
    </Link>
  );
}

interface ListLinkProps {
  task: ListRow;
  href: string;
  current: boolean;
  number: number;
}

export function ListLink({ task, href, current, number }: ListLinkProps) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(row, "h-10 items-center overflow-hidden")}
    >
      <StatusIcon status={task.status} />
      <span className="w-10 shrink-0 text-subtle text-xs tabular-nums in-aria-[current=page]:text-foreground">
        {number}
      </span>
      <MathHtml as="span" html={task.html} className={preview} />
    </Link>
  );
}
