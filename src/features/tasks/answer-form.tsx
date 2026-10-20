"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useState } from "react";
import type { TaskStatus } from "@/features/progress/status";
import { StatusIcon } from "@/features/progress/status-icon";
import { useRouter } from "@/i18n/navigation";
import { isRight, type PartOutcome } from "@/lib/part-outcome";
import { useErrorText } from "@/lib/use-error-text";
import { ActionBar } from "./action-bar";
import { checkAnswer } from "./answer-action";
import { AnswerField } from "./answer-field";
import type { AnswerState } from "./answer-state";
import type { PartLabel } from "./parts";
import { useTaskSession } from "./task-session";

interface AnswerFormProps {
  taskId: string;
  parts: PartLabel[];
  unchecked: string[];
  next?: string;
  fallback: string;
}

interface Checked {
  outcomes: PartOutcome[];
  correct: boolean;
}

const fieldStates: Record<PartOutcome, AnswerState> = {
  right: "correct",
  wrong: "wrong",
  empty: "empty",
  unreadable: "unreadable",
};

type Verdict = "correct" | "wrong" | "unreadable" | "incomplete";

function verdictOf(outcomes: PartOutcome[]): Verdict {
  if (outcomes.every(isRight)) return "correct";
  if (outcomes.includes("wrong")) return "wrong";
  return outcomes.includes("unreadable") ? "unreadable" : "incomplete";
}

const verdicts: Record<Verdict, { look: string; status?: TaskStatus }> = {
  correct: { look: "text-success-text", status: "solved" },
  wrong: { look: "text-error-text", status: "wrong" },
  unreadable: { look: "text-overtime-text" },
  incomplete: { look: "text-overtime-text" },
};

function Result({ checked: { outcomes } }: { checked: Checked }) {
  const t = useTranslations("Solve");
  const verdict = verdictOf(outcomes);
  const { look, status } = verdicts[verdict];
  return (
    <span
      role="status"
      className={cn(
        "order-3 flex items-center gap-2 font-semibold text-base",
        look,
      )}
    >
      {status && <StatusIcon status={status} className="size-5" />}
      {t(verdict)}
      {verdict === "wrong" && outcomes.length > 1 && (
        <small className="font-normal text-muted-foreground text-sm">
          {t("partsRight", {
            right: outcomes.filter(isRight).length,
            total: outcomes.length,
          })}
        </small>
      )}
    </span>
  );
}

export function AnswerForm({
  taskId,
  parts,
  unchecked,
  next,
  fallback,
}: AnswerFormProps) {
  const t = useTranslations("Solve");
  const router = useRouter();
  const { execute, result, isPending, hasErrored } = useAction(checkAnswer, {
    onSuccess: () => router.refresh(),
  });
  const errorText = useErrorText();
  const help = useTaskSession();
  const [edited, setEdited] = useState(false);
  const [values, setValues] = useState(() => parts.map(() => ""));
  const onChange = useCallback((index: number, value: string) => {
    setEdited(true);
    setValues((all) => all.with(index, value));
  }, []);

  const checked = edited ? undefined : result.data;
  const fields = parts.map((part, i) => ({
    part,
    id: `answer-${taskId}-${i}`,
  }));
  const grid = parts.length >= 2 && parts.every((p) => !p.caption);
  const stateOf = (i: number): AnswerState =>
    checked ? fieldStates[checked.outcomes[i] ?? "empty"] : "empty";

  return (
    <form
      action={(form) => {
        setEdited(false);
        execute(form);
      }}
      className="mt-6 flex max-w-task flex-col gap-4 md:mt-8"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="sessionId" value={help.session.id} />
      <input type="hidden" name="startedAt" value={help.session.startedAt} />
      <div
        className={cn("flex flex-col gap-4", grid && "md:grid md:grid-cols-2")}
      >
        {fields.map(({ part, id }, i) => (
          <AnswerField
            key={id}
            id={id}
            index={i}
            name="answer"
            label={
              parts.length === 1
                ? t("yourAnswer")
                : t("answerPart", { number: i + 1 })
            }
            part={part}
            variant="solve"
            placeholder={
              part.letter || part.prefix
                ? undefined
                : `\\text{${t("placeholder")}}`
            }
            state={stateOf(i)}
            onChange={onChange}
          />
        ))}
      </div>
      {unchecked.length > 0 && (
        <p className="-mt-1 text-subtle text-xs">
          {t("unchecked", { parts: unchecked.join(", ") })}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3">
        <ActionBar
          go={Boolean(checked?.correct) || help.solution}
          next={next ?? fallback}
          skip={next}
          checked={Boolean(checked)}
          disabled={
            isPending ||
            values.every((v) => !v.trim()) ||
            checked?.correct === false
          }
        />
        {hasErrored && (
          <span role="alert" className="text-error-text">
            {errorText()}
          </span>
        )}
        {checked && <Result checked={checked} />}
      </div>
    </form>
  );
}
