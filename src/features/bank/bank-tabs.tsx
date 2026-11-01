"use client";

import { useTranslations } from "next-intl";
import { use, useTransition } from "react";
import { LinkTabs } from "@/components/link-tabs";
import { useRouter } from "@/i18n/navigation";
import { type BrowserEvents, intentOf } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";
import { useBankState } from "./filters/bank-state";
import { bankHref } from "./params";

export interface BankPick {
  href: string;
  recommendation?: BrowserEvents["recommendation_made"];
}

interface TabsProps extends Partial<BankPick> {
  start: string;
}

function Tabs({ start, href, recommendation }: TabsProps) {
  const t = useTranslations("Bank");
  const seen = useExposure("recommendation_made", recommendation);
  const [topic] = useBankState().topic;
  const router = useRouter();
  const [starting, startTransition] = useTransition();
  return (
    <LinkTabs
      ref={seen}
      label={t("title")}
      variant="fill"
      items={[
        {
          href,
          onSelect: () => startTransition(() => router.push(start)),
          label: t("recommended"),
          active: starting,
          intent: intentOf({ via: "picker", placement: "bank_tab" }),
        },
        { href: bankHref({ topic }), label: t("all"), active: !starting },
      ]}
    />
  );
}

interface BankTabsProps {
  start: string;
  pick?: Promise<BankPick>;
}

export function BankTabs({ start, pick }: BankTabsProps) {
  const resolved = pick && use(pick);
  return <Tabs key={resolved?.href} start={start} {...resolved} />;
}
