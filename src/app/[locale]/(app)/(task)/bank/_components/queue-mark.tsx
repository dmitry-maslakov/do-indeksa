import { CircleIcon, RotateCcwIcon } from "lucide-react";
import type { QueueRow } from "@/features/bank/queue/queue";
import type { TouchStatus } from "@/features/progress/status";
import { StatusIcon } from "@/features/progress/status-icon";

export type RowState = "past" | "current" | "next" | "later";

type Mark = "here" | "next" | "later" | "repeat" | TouchStatus;

const resolved: TouchStatus[] = ["solved", "wrong", "revealed"];

export function resultOf({ status }: QueueRow, state: RowState) {
  if (state === "past") return status;
  if (state === "current" && status && resolved.includes(status)) return status;
}

function markOf(task: QueueRow, state: RowState): Mark {
  const result = resultOf(task, state);
  if (result) return result;
  if (state === "past") return "opened";
  if (state === "current") return "here";
  return task.repeat ? "repeat" : state;
}

function Icon({ mark }: { mark: Mark }) {
  switch (mark) {
    case "here":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="size-4">
          <circle
            cx="12"
            cy="12"
            r="9.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        </svg>
      );
    case "next":
      return <CircleIcon aria-hidden className="size-4 text-foreground" />;
    case "later":
      return <CircleIcon aria-hidden className="size-4 text-subtle/50" />;
    case "repeat":
      return (
        <span className="grid size-4 place-items-center rounded-full bg-progress-tint text-progress-text">
          <RotateCcwIcon aria-hidden className="size-2.5 stroke-3" />
        </span>
      );
    default:
      return <StatusIcon status={mark} decorative />;
  }
}

export function QueueMark({
  task,
  state,
}: {
  task: QueueRow;
  state: RowState;
}) {
  const mark = markOf(task, state);
  return (
    <span className="mt-0.5 flex shrink-0">
      <Icon mark={mark} />
    </span>
  );
}
