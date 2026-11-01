"use client";

import { cn } from "cn";
import { EyeIcon, LightbulbIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { isRight, type PartOutcome } from "@/db/columns";
import { cardsOf } from "@/features/practice/reveal/help";
import { RevealError } from "@/features/practice/reveal/reveal";
import { useReveal } from "@/features/practice/reveal/use-reveal";
import { useTaskSession } from "@/features/practice/session/task-session";
import type { TaskStatus } from "@/features/progress/status";
import { StatusIcon } from "@/features/progress/status-icon";
import { type Verdict, verdictOf } from "./verdicts";

interface AnswerStatusProps {
  taskId: string;
  answerText: boolean;
  outcomes?: PartOutcome[];
  solved: number;
  total: number;
}

const verdicts: Record<Verdict, { look: string; status?: TaskStatus }> = {
  correct: { look: "text-success-text", status: "solved" },
  wrong: { look: "text-error-text", status: "wrong" },
  unreadable: { look: "text-overtime-text" },
  incomplete: { look: "text-overtime-text" },
};

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-muted px-2.5 font-medium text-muted-foreground text-xs [&_svg]:size-3.5">
      {children}
    </span>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <small className="font-normal text-muted-foreground text-sm">
      {children}
    </small>
  );
}

function Content({
  taskId,
  answerText,
  outcomes,
  solved,
  total,
}: AnswerStatusProps) {
  const t = useTranslations("Solve");
  const { hints, shown, solution, opened } = useTaskSession();
  const { isError, refetch } = useReveal(taskId, shown);
  if (solved === total)
    return (
      <>
        <span className="flex items-center gap-2 text-success-text">
          <StatusIcon status="solved" className="size-5" />
          {t("correct")}
        </span>
        {hints > 0 && (
          <Tag>
            <LightbulbIcon aria-hidden />
            {t("withHint")}
          </Tag>
        )}
      </>
    );
  if (shown)
    return (
      <>
        <span className="flex items-center gap-2 text-data">
          <EyeIcon aria-hidden className="size-5" />
          {t(solution ? "solutionOpened" : "answerShown")}
        </span>
        {total > 1 && solved > 0 && (
          <Note>{t("ownParts", { own: solved, total })}</Note>
        )}
        {isError && !cardsOf(opened, answerText).includes(shown) && (
          <RevealError onRetry={() => refetch()} />
        )}
      </>
    );
  if (!outcomes) return null;
  const verdict = verdictOf(outcomes);
  const { look, status } = verdicts[verdict];
  return (
    <span className={cn("flex items-center gap-2", look)}>
      {status && <StatusIcon status={status} className="size-5" />}
      {t(verdict)}
      {verdict === "wrong" && outcomes.length > 1 && (
        <Note>
          {t("partsRight", {
            right: outcomes.filter(isRight).length,
            total: outcomes.length,
          })}
        </Note>
      )}
    </span>
  );
}

export function AnswerStatus(props: AnswerStatusProps) {
  return (
    <div
      role="status"
      className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-base empty:hidden"
    >
      <Content {...props} />
    </div>
  );
}
