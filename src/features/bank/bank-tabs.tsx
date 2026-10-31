"use client";

import { useTranslations } from "next-intl";
import { use } from "react";
import { LinkTabs } from "@/components/link-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { type BrowserEvents, intentOf } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";
import { useBankState } from "./filters/bank-state";
import { bankHref } from "./params";

export interface BankPick {
  href: string;
  recommendation?: BrowserEvents["recommendation_made"];
}

function Tabs({ href, recommendation }: BankPick) {
  const t = useTranslations("Bank");
  const seen = useExposure("recommendation_made", recommendation);
  const [topic] = useBankState().topic;
  return (
    <LinkTabs
      ref={seen}
      label={t("title")}
      variant="fill"
      items={[
        {
          href,
          label: t("recommended"),
          active: false,
          intent: intentOf({ via: "picker", placement: "bank_tab" }),
        },
        { href: bankHref({ topic }), label: t("all"), active: true },
      ]}
    />
  );
}

export function BankTabs({ pick }: { pick?: Promise<BankPick> }) {
  const resolved = pick && use(pick);
  if (!resolved) return <Skeleton className="h-10 rounded-xl" />;
  return <Tabs key={resolved.href} {...resolved} />;
}
