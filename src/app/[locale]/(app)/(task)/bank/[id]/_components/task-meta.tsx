import { useTranslations } from "next-intl";
import type { ExamSource } from "@/features/bank/source";
import type { Level } from "@/features/catalog/level";
import type { Touched } from "@/features/progress/status";
import { StatusIcon, statusTones } from "@/features/progress/status-icon";

interface TaskMetaProps {
  topic: string;
  exam: ExamSource | null;
  level: Level;
  before?: Touched["status"];
}

function Dot() {
  return <span className="size-1 shrink-0 rounded-full bg-input" />;
}

export function ExamMark({ year }: { year: number }) {
  const t = useTranslations("Solve");
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground before:size-2 before:rounded-xs before:bg-exam">
      {t("exam", { year: String(year) })}
    </span>
  );
}

export function TaskMeta({ topic, exam, level, before }: TaskMetaProps) {
  const t = useTranslations("Solve");
  const bank = useTranslations("Bank");
  return (
    <div className="flex min-w-0 flex-1 items-center gap-x-2 gap-y-1 overflow-hidden whitespace-nowrap pt-2 text-subtle text-xs leading-snug md:flex-wrap md:pt-0 md:text-sm">
      {before && <StatusIcon status={before} className="md:hidden" />}
      <span className="min-w-0 truncate">{topic}</span>
      <span
        className={`items-center gap-2 ${exam ? "flex" : "hidden md:flex"}`}
      >
        <Dot />
        {exam ? (
          <>
            <span className="md:hidden">
              <ExamMark year={exam.year} />
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
        <span
          className={`hidden items-center gap-2 md:flex ${statusTones[before]}`}
        >
          <Dot />
          <StatusIcon status={before} decorative />
          {t("before", { status: before })}
        </span>
      )}
    </div>
  );
}
