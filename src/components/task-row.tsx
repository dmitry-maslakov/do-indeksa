import { cn } from "cn";
import { MathHtml } from "@/components/math-html";
import type { TaskSummary } from "@/content/tasks";
import { Link } from "@/i18n/navigation";
import type { TaskStatus } from "@/lib/progress";

interface TaskRowProps {
  task: TaskSummary;
  active: boolean;
  meta: string;
  status?: TaskStatus;
}

export function TaskRow({ task, active, meta, status }: TaskRowProps) {
  return (
    <Link
      href={`/bank/${task.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex gap-3 rounded-xl px-3 py-2.5 text-sm leading-snug outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-data-tint font-semibold text-data hover:bg-data-tint",
      )}
    >
      <span
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full border-[1.5px] border-border",
          status === "solved" && "border-0 bg-data",
          status === "wrong" && "border-error bg-error-tint",
          active && "border-0 bg-primary",
        )}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <MathHtml
          html={task.statement}
          className="line-clamp-2 leading-snug [&_.katex-display]:my-0 [&_.katex-display]:inline [&_p]:inline"
        />
        <span className="font-normal text-subtle text-xs">{meta}</span>
      </span>
    </Link>
  );
}
