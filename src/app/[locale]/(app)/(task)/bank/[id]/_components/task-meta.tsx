import { cn } from "cn";
import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { use } from "react";
import { ExamMark } from "@/components/exam-mark";
import type { Before } from "@/features/bank/queue/queue";
import type { Level } from "@/features/catalog/level";
import type { ExamSource } from "@/features/catalog/source";
import { StatusIcon, statusTones } from "@/features/progress/status-icon";

interface TaskMetaProps {
  id: string;
  topic: string;
  exam: ExamSource | null;
  level: Level;
  before?: Promise<Before | undefined>;
}

const tones = { ...statusTones, repeat: "text-progress-text" };

function BeforeIcon({
  before,
  decorative = false,
  className,
}: {
  before: Before;
  decorative?: boolean;
  className?: string;
}) {
  const t = useTranslations("Solve");
  if (before !== "repeat")
    return (
      <StatusIcon
        status={before}
        decorative={decorative}
        className={className}
      />
    );
  return (
    <RotateCcwIcon
      role={decorative ? undefined : "img"}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : t("repeat")}
      className={cn(
        "size-4 shrink-0 stroke-[2.4] text-progress-text",
        className,
      )}
    />
  );
}

function Dot() {
  return <span className="size-1 shrink-0 rounded-full bg-input" />;
}

export function TaskMeta({ id, topic, exam, level, ...props }: TaskMetaProps) {
  const t = useTranslations("Solve");
  const before = props.before && use(props.before);
  const bank = useTranslations("Bank");
  return (
    <div className="flex min-w-0 flex-1 items-center gap-x-2 gap-y-1 overflow-hidden whitespace-nowrap pt-2 text-subtle text-xs leading-snug md:flex-wrap md:pt-0 md:text-sm">
      {before && <BeforeIcon before={before} className="md:hidden" />}
      <span className="min-w-0 truncate">{topic}</span>
      <span
        className={`items-center gap-2 ${exam ? "flex" : "hidden md:flex"}`}
      >
        <Dot />
        {exam ? (
          <>
            <span className="md:hidden">
              <ExamMark>{t("exam", { year: String(exam.year) })}</ExamMark>
            </span>
            <span className="hidden md:inline">
              {bank("exam", {
                year: String(exam.year),
                position: exam.position,
              })}
            </span>
          </>
        ) : (
          bank("sources", { source: "ours" })
        )}
      </span>
      <span className="hidden items-center gap-2 md:flex">
        <Dot />
        {bank("taskLevel", { level })}
      </span>
      {before && (
        <span className={`hidden items-center gap-2 md:flex ${tones[before]}`}>
          <Dot />
          <BeforeIcon before={before} decorative />
          {t("before", { status: before })}
        </span>
      )}
      <span className="flex items-center gap-2">
        <Dot />
        {id}
      </span>
    </div>
  );
}
