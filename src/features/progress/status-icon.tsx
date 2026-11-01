import { cn } from "cn";
import { CircleCheckIcon, CircleIcon, CircleXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TouchStatus } from "./status";

const empty = { Icon: CircleIcon, look: "text-input" } as const;

const icons = {
  new: empty,
  opened: empty,
  skipped: empty,
  revealed: empty,
  solved: { Icon: CircleCheckIcon, look: "fill-success stroke-card" },
  wrong: { Icon: CircleXIcon, look: "fill-error stroke-card" },
} as const;

export const statusTones = {
  solved: "text-success-text",
  wrong: "text-error-text",
} as const;

interface StatusIconProps {
  status?: "new" | TouchStatus;
  decorative?: boolean;
  className?: string;
}

export function StatusIcon({
  status = "new",
  decorative = false,
  className,
}: StatusIconProps) {
  const t = useTranslations("Solve");
  const { Icon, look } = icons[status];
  return (
    <Icon
      role={decorative ? undefined : "img"}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : t("status", { status })}
      className={cn("size-4 shrink-0", look, className)}
    />
  );
}
