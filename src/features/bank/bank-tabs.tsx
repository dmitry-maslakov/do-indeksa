import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { intentOf } from "@/lib/analytics-browser";

interface BankTabsProps {
  recommended?: string;
}

export function BankTabs({ recommended }: BankTabsProps) {
  const t = useTranslations("Bank");
  if (!recommended) return <Skeleton className="h-10 rounded-xl" />;
  return (
    <LinkTabs
      label={t("title")}
      variant="fill"
      items={[
        {
          href: recommended,
          label: t("recommended"),
          active: false,
          prefetch: false,
          intent: intentOf({ via: "picker", placement: "bank_tab" }),
        },
        { href: "/bank", label: t("all"), active: true },
      ]}
    />
  );
}
