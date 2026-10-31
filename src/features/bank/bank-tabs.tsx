"use client";

import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { type BrowserEvents, intentOf } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";

interface BankTabsProps {
  recommended?: string;
  recommendation?: BrowserEvents["recommendation_made"];
}

export function BankTabs({ recommended, recommendation }: BankTabsProps) {
  const t = useTranslations("Bank");
  const seen = useExposure("recommendation_made", recommendation);
  if (!recommended) return <Skeleton className="h-10 rounded-xl" />;
  return (
    <LinkTabs
      ref={seen}
      label={t("title")}
      variant="fill"
      items={[
        {
          href: recommended,
          label: t("recommended"),
          active: false,
          intent: intentOf({ via: "picker", placement: "bank_tab" }),
        },
        { href: "/bank", label: t("all"), active: true },
      ]}
    />
  );
}
