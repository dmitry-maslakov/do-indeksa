import { cn } from "cn";
import { useTranslations } from "next-intl";
import { ExamMark } from "@/components/exam-mark";
import { MathHtml } from "@/components/math-html";
import { TopicIcon } from "@/features/catalog/topic-icon";
import { StatusIcon, statusTones } from "@/features/progress/status-icon";
import { Link } from "@/i18n/navigation";
import type { BankCard } from "./feed";

function StatusMark({ status }: { status: BankCard["status"] }) {
  const t = useTranslations("Bank");
  if (status === "new") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm",
        statusTones[status],
      )}
    >
      <StatusIcon status={status} decorative className="size-3" />
      {t("mark", { status })}
    </span>
  );
}

function Source({ exam }: Pick<BankCard, "exam">) {
  const t = useTranslations("Bank");
  if (!exam) return <span>{t("sources", { source: "ours" })}</span>;
  return (
    <ExamMark>
      {t("exam", { year: String(exam.year), position: exam.position })}
    </ExamMark>
  );
}

interface TaskCardProps {
  card: BankCard;
  intent: string;
}

export function TaskCard({ card, intent }: TaskCardProps) {
  const t = useTranslations("Bank");

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-card px-4 pt-4 pb-4 [contain-intrinsic-size:auto_200px] [content-visibility:auto] lg:bg-muted lg:px-5 lg:pt-4 lg:pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 font-semibold text-sm">
          <TopicIcon icon={card.topic.icon} tone={card.topic.tone} size="sm" />
          {card.topic.name}
        </span>
        <span className="order-3 flex basis-full flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
          <Source exam={card.exam} />
          <span>{t("taskLevel", { level: card.level })}</span>
          <StatusMark status={card.status} />
        </span>
      </div>
      <Link
        href={`/bank/${card.id}`}
        prefetch={false}
        data-intent={intent}
        className="rounded-lg text-base leading-relaxed outline-none  focus-visible:ring-2 focus-visible:ring-ring lg:text-lg"
      >
        <MathHtml
          html={card.statement}
          className="leading-relaxed [&_.katex-display]:my-2 [&_p+p]:mt-2"
        />
      </Link>
    </article>
  );
}
