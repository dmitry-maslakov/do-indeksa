import { cn } from "cn";
import { useState } from "react";
import { MathHtml } from "@/components/math-html";
import { RailLink } from "@/components/rail";
import type { QueueRow } from "@/features/bank/queue/queue";
import type { BrowserEvents } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";
import { QueueMark, type RowState } from "./queue-mark";
import { QueueMeta } from "./queue-meta";

const grows =
  "grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-260 ease-out data-fresh:starting:grid-rows-[0fr] data-fresh:starting:opacity-0 motion-reduce:transition-none";

const line =
  "before:pointer-events-none before:absolute before:top-0 before:left-[15.25px] before:h-2.5 before:w-[1.5px] before:bg-input after:pointer-events-none after:absolute after:top-6.5 after:bottom-0 after:left-[15.25px] after:w-[1.5px] after:bg-input first:before:hidden last:after:hidden data-ahead:before:dashed-v data-ahead:after:dashed-v data-here:after:dashed-v";

interface QueueLinkProps {
  task: QueueRow;
  href: string;
  intent: string;
  state: RowState;
  ahead: boolean;
  entering: boolean;
  page: string;
  recommendation?: BrowserEvents["recommendation_made"];
}

export function QueueLink({
  task,
  href,
  intent,
  state,
  ahead,
  entering,
  page,
  recommendation,
}: QueueLinkProps) {
  const [fresh, setFresh] = useState(entering);
  const seen = useExposure("recommendation_made", recommendation, page);
  return (
    <div
      data-ahead={ahead || undefined}
      data-here={state === "current" || undefined}
      data-fresh={fresh || undefined}
      onTransitionEnd={(event) =>
        event.target === event.currentTarget && setFresh(false)
      }
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
      </div>
    </div>
  );
}
