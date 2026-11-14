import { cn } from "cn";
import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import type { PartOutcome } from "@/db/columns";
import type { PartLabel } from "@/features/catalog/parts";
import type { PartAnswer, Shown } from "@/features/tests/review";
import type { ReviewEntry } from "./review-entry";

function Value({ shown, part }: { shown: Shown; part?: PartLabel }) {
  const field = useTranslations("Field");
  const prefix = part?.prefix;
  const suffix = part?.suffix;
  if ("yesno" in shown) return field(shown.yesno);
  if ("letters" in shown) return shown.letters.join(", ");
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      {prefix && (
        <MathHtml
          as="span"
          html={prefix}
          className="text-muted-foreground [&_p]:inline"
        />
      )}
      <MathHtml as="span" html={shown.html} />
      {suffix && (
        <MathHtml
          as="span"
          html={suffix}
          className="text-muted-foreground [&_p]:inline"
        />
      )}
    </span>
  );
}

const givenTone: Partial<Record<PartOutcome, string>> = {
  right: "bg-success-tint",
  wrong: "bg-error-tint",
  unreadable: "bg-overtime-tint",
};

function Given({
  answer,
  outcome,
  part,
}: {
  answer: PartAnswer;
  outcome?: PartOutcome;
  part?: PartLabel;
}) {
  const t = useTranslations("Review");
  if (outcome === "unreadable")
    return <span className="text-overtime-text">{t("unread")}</span>;
  if (!answer.given || !outcome || outcome === "empty")
    return <span className="text-subtle">{t("skipped")}</span>;
  return (
    <span className="flex items-center gap-2">
      {outcome === "right" ? (
        <CheckIcon aria-hidden className="size-4 shrink-0 text-success-text" />
      ) : (
        <XIcon aria-hidden className="size-4 shrink-0 text-error-text" />
      )}
      <span className="sr-only">
        {t("status", { segment: outcome === "right" ? "done" : "error" })}
      </span>
      <Value shown={answer.given} part={part} />
    </span>
  );
}

export function Answers({ entry }: { entry: ReviewEntry }) {
  const t = useTranslations("Review");
  const lettered = entry.answers.length > 1;
  const letters = entry.parts.map((part) => part.letter);
  const cell = "px-3.5 py-2.5 text-left align-middle";

  return (
    <div className="overflow-hidden rounded-[14px] border">
      <table className="w-full border-collapse text-sm [&_.katex]:text-[1.05em]">
        <caption className="sr-only">{t("answers")}</caption>
        <thead className="bg-muted text-subtle text-xs">
          <tr>
            {lettered && <th className={cn(cell, "w-11 py-2")} />}
            <th scope="col" className={cn(cell, "py-2 font-normal")}>
              {t("given")}
            </th>
            <th scope="col" className={cn(cell, "py-2 font-normal")}>
              {t("correct")}
            </th>
          </tr>
        </thead>
        <tbody>
          {entry.answers.map((answer, i) => {
            const part = entry.parts[i];
            const outcome = entry.outcomes[i];
            const repeated = i > 0 && letters[i] === letters[i - 1];
            return (
              <tr
                key={`${part?.letter}${part?.prefix}${part?.caption}`}
                className={cn("border-t", repeated && "border-t-border/40")}
              >
                {lettered && (
                  <th scope="row" className={cn(cell, "font-semibold")}>
                    {!repeated && letters[i]}
                  </th>
                )}
                <td className={cn(cell, outcome && givenTone[outcome])}>
                  <Given answer={answer} outcome={outcome} part={part} />
                </td>
                <td className={cell}>
                  <Value shown={answer.key} part={part} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
