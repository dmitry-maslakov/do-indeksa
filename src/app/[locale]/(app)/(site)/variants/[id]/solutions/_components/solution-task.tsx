import { cn } from "cn";
import { ArrowUpRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { ReportTask } from "@/features/practice/report-task";
import type { Slot } from "@/features/variants/variants";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";

export interface Solution extends Slot {
  topicName: string;
  statement: string;
  answer: string;
  solution: string;
}

const label = "font-semibold text-subtle text-xs";
const math = "overflow-x-auto leading-relaxed [&_strong]:font-semibold";

export function SolutionTask({ solution }: { solution: Solution }) {
  const t = useTranslations("Solutions");
  const solve = useTranslations("Solve");

  return (
    <article className="flex flex-col gap-4 md:rounded-[20px] md:border md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-muted-foreground text-xs tabular-nums">
            {t("task", { number: solution.number })}
          </span>
          <h2 className="font-semibold text-[17px] leading-snug">
            {solution.topicName}
          </h2>
        </div>
        <span className="ml-auto shrink-0 text-muted-foreground text-sm tabular-nums">
          {t("points", { points: solution.points })}
        </span>
      </div>
      <MathHtml
        html={solution.statement}
        className={cn(math, "text-base md:text-[17px]")}
      />
      <section className="flex flex-col gap-1 rounded-xl bg-muted px-4 py-3">
        <h3 className={label}>{solve("answer")}</h3>
        <MathHtml html={solution.answer} className={math} />
      </section>
      <section className="flex flex-col gap-1">
        <h3 className={label}>{solve("solution")}</h3>
        <MathHtml html={solution.solution} className={math} />
      </section>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href={`/bank/${solution.taskId}`}
          data-intent={intentOf({ via: "solutions" })}
          className="inline-flex items-center gap-1 rounded-sm font-semibold text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {t("toBank")}
          <ArrowUpRightIcon aria-hidden className="size-4" />
        </Link>
        <ReportTask taskId={solution.taskId} />
      </div>
    </article>
  );
}
