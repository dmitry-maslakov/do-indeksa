import { cn } from "cn";
import { useTranslations } from "next-intl";
import { lettersOf, type RenderedChoice } from "@/features/catalog/choice";
import {
  OptionBody,
  type OptionLook,
  optionList,
  optionRow,
} from "@/features/practice/answer/field/option-row";
import type { Shown } from "@/features/tests/review";
import type { ReviewEntry } from "./review-entry";

type Tag = "yours" | "key" | "marked" | "markedWrong" | "missed";

function markOf(
  picked: boolean,
  correct: boolean,
  many: boolean,
): { look: OptionLook; tag?: Tag } {
  if (picked)
    return {
      look: correct ? "right" : "wrong",
      tag: many ? (correct ? "marked" : "markedWrong") : "yours",
    };
  if (correct) return { look: "missed", tag: many ? "missed" : "key" };
  return { look: "idle" };
}

const lettersIn = (shown?: Shown): string[] =>
  shown && "letters" in shown ? shown.letters : [];

export function ChoiceAnswers({
  entry,
  choice,
}: {
  entry: ReviewEntry;
  choice: RenderedChoice;
}) {
  const t = useTranslations("Choice");
  const [answer] = entry.answers;
  const key = lettersIn(answer?.key);
  const given = lettersIn(answer?.given);
  const letters = lettersOf(choice.options);

  return (
    <div className="flex flex-col gap-2.5">
      {choice.many && (
        <p className="text-[13px] text-subtle">
          {t("scoring", { scoring: entry.scoring })}
        </p>
      )}
      <ul aria-label={t("label")} className={optionList(choice.short)}>
        {choice.options.map((html, i) => {
          const letter = letters[i] ?? "";
          const mark = markOf(
            given.includes(letter),
            key.includes(letter),
            choice.many,
          );
          return (
            <li
              key={letter}
              className={optionRow({ size: "sm", look: mark.look })}
            >
              <OptionBody
                letter={letter}
                html={html}
                many={choice.many}
                look={mark.look}
                size="sm"
                end={
                  mark.tag && (
                    <span
                      className={cn(
                        "ml-auto shrink-0 font-medium text-[13px]",
                        mark.look === "wrong"
                          ? "text-error-text"
                          : "text-success-text",
                      )}
                    >
                      {t("tag", { tag: mark.tag })}
                    </span>
                  )
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
