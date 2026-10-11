import { cn } from "cn";
import { PanelLeftOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { TaskStatus } from "@/lib/progress";

interface RailNumbersProps {
  ids: string[];
  current: string;
  statuses: Record<string, TaskStatus>;
  onExpand: () => void;
}

export function RailNumbers({
  ids,
  current,
  statuses,
  onExpand,
}: RailNumbersProps) {
  const t = useTranslations("Solve");

  return (
    <Card
      data-rail="collapsed"
      size="sm"
      className="order-last items-center gap-2 md:order-none"
    >
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onExpand}
        aria-label={t("expand")}
      >
        <PanelLeftOpenIcon />
      </Button>
      {ids.map((id, i) => (
        <Link
          key={id}
          href={`/bank/${id}`}
          aria-current={id === current ? "page" : undefined}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg border border-border font-semibold text-[13px] text-subtle",
            statuses[id] === "solved" && "border-0 bg-data-tint text-data",
            statuses[id] === "wrong" &&
              "border-0 bg-error-tint text-error-text",
            id === current && "border-0 bg-primary text-primary-foreground",
          )}
        >
          {i + 1}
        </Link>
      ))}
    </Card>
  );
}
