"use client";

import { cn } from "cn";
import { range } from "es-toolkit";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { saveReveal } from "@/features/practice/actions";
import { useTaskSession } from "@/features/practice/session/task-session";
import { RevealContent } from "./reveal";
import type { RevealPart } from "./reveals";

interface HelpPanelProps {
  taskId: string;
  hintCount: number;
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold text-muted-foreground text-xs">{label}</h2>
      {children}
    </section>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 rounded-full bg-muted px-4 font-medium text-sm outline-none transition-colors hover:bg-untouched focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
    </button>
  );
}

export function HelpPanel({ taskId, hintCount }: HelpPanelProps) {
  const t = useTranslations("Solve");
  const { track, hints, solution, showHint, showSolution } = useTaskSession();
  const [answer, setAnswer] = useState(false);
  const open = (part: RevealPart, show: () => void) => () => {
    track(
      async (sessionId) =>
        (await saveReveal({ taskId, part, owner: { sessionId } }))?.data ??
        undefined,
    );
    show();
  };
  const content = (part: RevealPart) => (
    <RevealContent
      taskId={taskId}
      part={part}
      className={cn(
        "text-base leading-relaxed [&_p+p]:mt-2",
        part === "solution" &&
          "[&>*+*]:mt-2 [&>*+*]:border-t [&>*+*]:border-dashed [&>*+*]:pt-2",
      )}
    />
  );

  return (
    <div className="mt-7 flex flex-col gap-4 border-t pt-4 md:mt-9">
      {(hints > 0 || solution || answer) && (
        <div className="flex flex-col gap-4">
          {range(hints).map((i) => (
            <Block key={i} label={t("hint")}>
              {content(i)}
            </Block>
          ))}
          {solution && (
            <Block label={t("solution")}>{content("solution")}</Block>
          )}
          {answer && <Block label={t("answer")}>{content("answer")}</Block>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {hints < hintCount && (
          <Chip label={t("hint")} onClick={open(hints, showHint)} />
        )}
        {!solution && (
          <Chip
            label={t("solution")}
            onClick={open("solution", showSolution)}
          />
        )}
        {!answer && (
          <Chip
            label={t("answer")}
            onClick={open("answer", () => setAnswer(true))}
          />
        )}
      </div>
    </div>
  );
}
