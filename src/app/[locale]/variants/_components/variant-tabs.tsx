import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface VariantTabsProps {
  tabs: readonly ("official" | "curated" | "history")[];
  current: string;
}

export function VariantTabs({ tabs, current }: VariantTabsProps) {
  const t = useTranslations("Variants");
  const labels = {
    official: t("official"),
    curated: t("curated"),
    history: t("history"),
  };

  return (
    <nav className="flex gap-1 rounded-xl bg-muted p-1">
      {tabs.map((tab) => (
        <Link
          key={tab}
          href={tab === "official" ? "/variants" : `/variants?tab=${tab}`}
          aria-current={tab === current ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-1.5 font-medium text-sm transition-colors",
            tab === current
              ? "bg-card text-foreground shadow-sm"
              : "text-subtle hover:text-foreground",
          )}
        >
          {labels[tab]}
        </Link>
      ))}
    </nav>
  );
}
