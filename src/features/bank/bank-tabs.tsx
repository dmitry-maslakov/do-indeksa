"use client";

import { useTranslations } from "next-intl";
import { use, useEffect, useTransition } from "react";
import { LinkTabs } from "@/components/link-tabs";
import { useRouter } from "@/i18n/navigation";
import { type BrowserEvents, intentOf } from "@/lib/analytics-browser";
import { useExposure } from "@/lib/use-exposure";
import { rememberList } from "./last-list";

export interface BankPick {
  href: string;
  recommendation?: BrowserEvents["recommendation_made"];
}

interface TabsProps extends Partial<BankPick> {
  start: string;
  list: string;
}

function Tabs({ start, list, href, recommendation }: TabsProps) {
  const t = useTranslations("Bank");
  const seen = useExposure("recommendation_made", recommendation);
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
        { href: list, label: t("all"), active: !starting },
      ]}
    />
  );
}

interface BankTabsProps {
  start: string;
  list: string;
  pending: boolean;
  pick?: Promise<BankPick>;
}

export function BankTabs({ start, list, pending, pick }: BankTabsProps) {
  const resolved = pick && use(pick);
  useEffect(() => {
    if (!pending) rememberList(list);
  }, [pending, list]);
  return <Tabs key={resolved?.href} start={start} list={list} {...resolved} />;
}
