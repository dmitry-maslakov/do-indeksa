"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "cn";
import { xor } from "es-toolkit";
import { CircleDotIcon, SquareCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useRef,
} from "react";
import type { PartOutcome } from "@/db/columns";
import {
  lettersOf,
  pickedOf,
  pickOf,
  type RenderedChoice,
  sentOf,
} from "@/features/catalog/choice";
import { StatusIcon } from "@/features/progress/status-icon";
import { countPick, type InputStats } from "../input-stats";
import {
  OptionBody,
  type OptionLook,
  optionList,
  optionRow,
} from "./option-row";
import { useLetterKeys } from "./use-letter-keys";

export type ChoiceResult = "right" | "shown" | PartOutcome[];

interface ChoiceFieldProps {
  id: string;
  choice: RenderedChoice;
  variant: "exam" | "solve";
  value: string[];
  result?: ChoiceResult;
  locked?: boolean;
  stats: RefObject<InputStats>;
  onChange: (value: string[]) => void;
}

function lookOf(
  index: number,
  picked: boolean,
  result?: ChoiceResult,
): OptionLook {
  if (!picked) return "idle";
  if (result === "right" || result === "shown") return result;
  const outcome = result?.[index];
  return outcome === "right" || outcome === "wrong" ? outcome : "on";
}

function Mark({ look }: { look: OptionLook }) {
  if (look !== "right" && look !== "wrong") return null;
  return (
    <StatusIcon
      status={look === "right" ? "solved" : "wrong"}
      className="ml-auto size-5.5"
    />
  );
}

const Kbd = (chunks: ReactNode) => (
  <kbd className="rounded-[5px] bg-muted px-1.5 py-px font-sans font-semibold text-muted-foreground text-xs">
    {chunks}
  </kbd>
);

export function ChoiceField({
  id,
  choice,
  variant,
  value,
  result,
  locked = false,
  stats,
  onChange,
}: ChoiceFieldProps) {
  const t = useTranslations("Choice");
  const list = useRef<HTMLDivElement>(null);
  const letters = lettersOf(choice.options);
  const picked = pickedOf(value);
  const pick = pickOf(choice);
  const change = (next: string[]) => {
    countPick(stats.current);
    onChange(sentOf(choice, next));
  };
  useLetterKeys(!locked, letters, (letter) => {
    change(choice.many ? xor(picked, [letter]) : [letter]);
    list.current
      ?.querySelector<HTMLElement>(`[data-letter="${letter}"]`)
      ?.focus();
  });
  const submit = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || variant === "exam") return;
    event.preventDefault();
    event.currentTarget
      .closest("form")
      ?.querySelector<HTMLButtonElement>("button[type=submit]:enabled")
      ?.click();
  };
  const howto = `${id}-howto`;
  const group = {
    ref: list,
    id,
    "aria-label": t("label"),
    "aria-describedby": howto,
    className: optionList(choice.short),
    onKeyDown: submit,
  };
  const items = (Root: typeof Radio.Root | typeof Checkbox.Root) =>
    letters.map((letter, i) => {
      const look = lookOf(choice.many ? i : 0, picked.includes(letter), result);
      return (
        <Root
          key={letter}
          value={letter}
          data-letter={letter}
          readOnly={locked}
          nativeButton
          render={<button type="button" />}
          className={cn(
            optionRow({ size: "lg", look }),
            locked ? "cursor-default" : look === "idle" && "hover:bg-untouched",
          )}
        >
          <OptionBody
            letter={letter}
            html={choice.options[i] ?? ""}
            many={choice.many}
            look={look}
            size="lg"
            end={<Mark look={look} />}
          />
        </Root>
      );
    });
  const Icon = choice.many ? SquareCheckIcon : CircleDotIcon;

  return (
    <div className="flex flex-col gap-3">
      <p
        id={howto}
        className="flex items-center gap-2 text-muted-foreground text-sm"
      >
        <Icon aria-hidden className="size-4 text-subtle" />
        {t(pick)}
      </p>
      {choice.many ? (
        <CheckboxGroup {...group} value={picked} onValueChange={change}>
          {items(Checkbox.Root)}
        </CheckboxGroup>
      ) : (
        <RadioGroup
          {...group}
          value={picked[0] ?? ""}
          readOnly={locked}
          onValueChange={(letter: string) => change([letter])}
        >
          {items(Radio.Root)}
        </RadioGroup>
      )}
      <p
        className={cn(
          "hidden text-[13px] text-subtle",
          !locked && "pointer-fine:block",
        )}
      >
        {t.rich(variant === "exam" ? "examKeys" : "keys", {
          pick,
          last: letters.at(-1) ?? "",
          kbd: Kbd,
        })}
      </p>
      {value.map((sent, i) => (
        <input key={letters[i]} type="hidden" name="answer" value={sent} />
      ))}
    </div>
  );
}
