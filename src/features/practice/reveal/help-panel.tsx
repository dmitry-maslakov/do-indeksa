"use client";

import { cn } from "cn";
import { BookOpenIcon, EyeIcon, LightbulbIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { MathHtml } from "@/components/math-html";
import { saveReveal } from "@/features/practice/actions";
import { useTaskSession } from "@/features/practice/session/task-session";
import { blocksOf, cardsOf, type HelpHtml, isHint, offered } from "./help";
import type { RevealPart } from "./reveals";

interface HelpPanelProps extends HelpHtml {
  taskId: string;
  answerText: boolean;
}

const icons = {
  hint: LightbulbIcon,
  answer: EyeIcon,
  solution: BookOpenIcon,
};

const kindOf = (part: RevealPart) => (isHint(part) ? "hint" : part);

function Block({
  part,
  label,
  hidden,
  children,
}: {
  part: RevealPart;
  label: string;
  hidden: boolean;
  children: ReactNode;
}) {
  const Icon = icons[kindOf(part)];
  const solution = part === "solution";
  return (
    <section
      hidden={hidden}
      className={cn(
        "flex flex-col gap-2",
        solution && "border-data-soft border-l-2 pl-4",
      )}
    >
      <h2
        className={cn(
          "flex items-center gap-1.5 font-semibold text-xs",
          solution ? "text-data" : "text-muted-foreground",
        )}
      >
        <Icon aria-hidden className="size-4" />
        {label}
      </h2>
      {children}
    </section>
  );
}

function Chip({
  part,
  label,
  count,
  onClick,
}: {
  part: RevealPart;
  label: string;
  count?: string;
  onClick: () => void;
}) {
  const Icon = icons[kindOf(part)];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-2 rounded-full bg-muted px-4 font-medium text-sm outline-none transition-colors hover:bg-untouched focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon aria-hidden className="size-4 text-muted-foreground" />
      {label}
      {count && <span className="font-normal text-subtle">{count}</span>}
    </button>
  );
}

export function HelpPanel({ taskId, answerText, ...help }: HelpPanelProps) {
  const t = useTranslations("Solve");
  const { track, note, opened, correct, open } = useTaskSession();
  const choose = (part: RevealPart) => () => {
    if (!isHint(part)) note({ revealed: true });
    track(
      async (sessionId) =>
        (await saveReveal({ taskId, part, owner: { sessionId } }))?.data ??
        undefined,
    );
    open(part);
  };
  const hintCount = help.hints.length;
  const cards = cardsOf(opened, answerText);
  const chips = offered({ opened, hintCount, correct });

  return (
    <div className="mt-7 flex flex-col gap-4 border-t pt-4 md:mt-9">
      {blocksOf(help, answerText).map(({ part, html }) => (
        <Block
          key={part}
          part={part}
          hidden={!cards.includes(part)}
          label={
            isHint(part)
              ? t("hintTitle", { number: part + 1, total: hintCount })
              : t(part)
          }
        >
          <MathHtml
            html={html}
            className={cn(
              "text-base leading-relaxed [&_p+p]:mt-2",
              part === "solution" &&
                "[&>*+*]:mt-2 [&>*+*]:border-t [&>*+*]:border-dashed [&>*+*]:pt-2",
            )}
          />
        </Block>
      ))}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((part) => (
            <Chip
              key={kindOf(part)}
              part={part}
              label={t(kindOf(part))}
              count={
                isHint(part)
                  ? t("hintStep", { next: part + 1, total: hintCount })
                  : undefined
              }
              onClick={choose(part)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
