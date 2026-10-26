import { cn } from "cn";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface ActionBarProps {
  go: boolean;
  next: string;
  skip?: string;
  checked: boolean;
  disabled: boolean;
}

export const phoneBar =
  "fixed inset-x-0 bottom-[max(var(--keyboard-height,0px),calc(var(--nav-bottom)+env(safe-area-inset-bottom)))] z-30 flex gap-2 border-t bg-card p-3 md:contents";
const primary = cn(
  buttonVariants({ variant: "lime", size: "pill" }),
  "order-2 flex-1 md:order-1 md:flex-none",
);

function Skip({ href, checked }: { href: string; checked: boolean }) {
  const t = useTranslations("Solve");
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "pill" }),
        "order-1 px-4 md:order-2",
        !checked && "md:bg-transparent md:px-3",
      )}
    >
      {!checked && <ClockIcon className="md:hidden" />}
      <span>{t(checked ? "further" : "skip")}</span>
    </Link>
  );
}

export function ActionBar({
  go,
  next,
  skip,
  checked,
  disabled,
}: ActionBarProps) {
  const t = useTranslations("Solve");
  return (
    <div className={phoneBar}>
      {go ? (
        <Link href={next} className={primary}>
          <span className="md:hidden">{t("next")}</span>
          <span className="hidden md:inline">{t("nextTask")}</span>
          <ArrowRightIcon />
        </Link>
      ) : (
        <Button type="submit" disabled={disabled} className={primary}>
          {t("check")}
        </Button>
      )}
      {!go && skip && <Skip href={skip} checked={checked} />}
    </div>
  );
}
