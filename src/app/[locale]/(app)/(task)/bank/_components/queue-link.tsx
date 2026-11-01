import { cn } from "cn";
import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { RailLink } from "@/components/rail";
import type { QueueRow } from "@/features/bank/queue/queue";
import type { BrowserEvents } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";
import { QueueMark, type RowState } from "./queue-mark";
import { QueueMeta } from "./queue-meta";

const grows =
  "grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-260 ease-out group-data-live/list:starting:grid-rows-[0fr] group-data-live/list:starting:opacity-0 motion-reduce:transition-none";

const line =
  "before:absolute before:top-0 before:left-[15.25px] before:h-2.5 before:w-[1.5px] before:bg-input after:absolute after:top-6.5 after:bottom-0 after:left-[15.25px] after:w-[1.5px] after:bg-input first:before:hidden last:after:hidden data-upcoming:before:dashed-v data-upcoming:after:dashed-v data-heading:after:dashed-v";

interface QueueLinkProps {
  task: QueueRow;
  href: string;
  intent: string;
  state: RowState;
  heading: boolean;
  page: string;
  recommendation?: BrowserEvents["recommendation_made"];
}

export function QueueLink({
  task,
  href,
  intent,
  state,
  heading,
  page,
  recommendation,
}: QueueLinkProps) {
  const t = useTranslations("Solve");
  const seen = useExposure("recommendation_made", recommendation, page);
  return (
    <div
      data-upcoming={state === "next" || state === "later" || undefined}
      data-heading={heading || undefined}
      className={cn("group/item relative", grows, line)}
    >
      <div className="min-h-0 overflow-hidden">
        <RailLink
          ref={seen}
          href={href}
          data-id={task.id}
          data-intent={intent}
          current={state === "current"}
          className={cn(
            "items-start py-2 transition-colors duration-260 focus-visible:ring-inset motion-reduce:transition-none aria-[current]:font-normal aria-[current]:shadow-none",
            state === "past" && "text-muted-foreground",
          )}
        >
          <QueueMark task={task} state={state} />
          <span className="flex min-w-0 flex-1 flex-col">
            <MathHtml
              as="span"
              html={task.html}
              className="line-clamp-2 leading-5"
              aria-hidden
            />
            <span className="sr-only">{task.label}</span>
            <QueueMeta task={task} state={state} />
          </span>
        </RailLink>
        <div
          aria-hidden={!heading}
          className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-260 ease-out group-data-heading/item:grid-rows-[1fr] motion-reduce:transition-none"
        >
          <h3 className="min-h-0 overflow-hidden pl-8 font-semibold text-subtle text-xs leading-4">
            <span className="block pt-2.5 pb-1">{t("upcoming")}</span>
          </h3>
        </div>
      </div>
    </div>
  );
}
