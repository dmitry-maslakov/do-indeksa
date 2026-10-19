import { cn } from "cn";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Markdown } from "@/components/markdown";
import { FavoriteButton } from "@/features/tasks/favorite-button";
import { TopicIcon } from "@/features/tasks/topic-icon";
import { Link } from "@/i18n/navigation";
import type { BankCard } from "./feed";

const marks = {
  solved: {
    Icon: CircleCheckIcon,
    tone: "text-success-text",
    fill: "fill-success",
  },
  wrong: { Icon: CircleXIcon, tone: "text-error-text", fill: "fill-error" },
};

function StatusMark({ status }: { status: BankCard["status"] }) {
  const t = useTranslations("Bank");
  if (status === "new") return null;
  const { Icon, tone, fill } = marks[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", tone)}>
      <Icon aria-hidden="true" className={cn("size-3 stroke-card", fill)} />
      {t("mark", { status })}
    </span>
  );
}

function Source({ exam }: Pick<BankCard, "exam">) {
  const t = useTranslations("Bank");
  if (!exam) return <span>{t("sources", { source: "ours" })}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground before:size-2 before:rounded-xs before:bg-exam">
      {t("exam", { year: String(exam.year), position: exam.position })}
    </span>
  );
}

interface TaskCardProps {
  card: BankCard;
  search: string;
  signedIn: boolean;
}

export function TaskCard({ card, search, signedIn }: TaskCardProps) {
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
        <div className="ml-auto">
          <FavoriteButton
            taskId={card.id}
            saved={card.favorite}
            signedIn={signedIn}
            compact
          />
        </div>
      </div>
      <Link
        href={`/bank/${card.id}${search}`}
        className="rounded-lg text-base leading-relaxed outline-none  focus-visible:ring-2 focus-visible:ring-ring lg:text-lg"
      >
        <Markdown
          source={card.statement}
          className="leading-relaxed [&_.katex-display]:my-2 [&_p+p]:mt-2"
        />
      </Link>
    </article>
  );
}
