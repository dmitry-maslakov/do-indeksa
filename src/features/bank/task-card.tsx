import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MathHtml } from "@/components/math-html";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { taskMeta } from "@/features/tasks/level";
import { Link } from "@/i18n/navigation";
import type { BankCard } from "./feed";

export function TaskCard({ card }: { card: BankCard }) {
  const t = useTranslations("Bank");

  return (
    <Link
      href={`/bank/${card.id}`}
      className="rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card size="sm" className="transition-shadow hover:shadow-raised">
        <div className="flex items-start justify-between gap-3 text-[13px]">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="tint" className="max-w-full whitespace-normal">
              {card.topic}
            </Badge>
            <span className="text-subtle">{taskMeta(card, t)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {card.status === "solved" && (
              <Badge variant="success" size="sm">
                {t("solved")}
              </Badge>
            )}
            {card.status === "wrong" && (
              <Badge variant="error" size="sm">
                {t("wrong")}
              </Badge>
            )}
            <StarIcon
              aria-label={card.favorite ? t("favorite") : undefined}
              aria-hidden={!card.favorite}
              className={cn(
                "size-4 text-subtle",
                card.favorite && "fill-overtime text-overtime",
              )}
            />
          </div>
        </div>
        <MathHtml html={card.statement} />
      </Card>
    </Link>
  );
}
