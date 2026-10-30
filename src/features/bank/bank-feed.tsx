"use client";

import { useTranslations } from "next-intl";
import { LoadMore } from "@/components/load-more";
import { intentOf } from "@/lib/analytics-browser";
import { type Page, useFeed } from "@/lib/use-feed";
import type { BankCard } from "./feed";
import { loadBankFilters } from "./params";
import { TaskCard } from "./task-card";

interface BankFeedProps {
  search: string;
  first: Page<BankCard>;
}

export function BankFeed({ search, first }: BankFeedProps) {
  const t = useTranslations("Bank");
  const feed = useFeed("/api/bank", first, search);
  const via = loadBankFilters(search).q ? "search" : "list";

  return (
    <>
      {feed.data.pages
        .flatMap((page) => page.items)
        .map((card, i) => (
          <TaskCard
            key={card.id}
            card={card}
            intent={intentOf({ via, placement: "card", rank: i + 1 })}
          />
        ))}
      <LoadMore key={feed.data.pages.length} feed={feed}>
        {t("more")}
      </LoadMore>
    </>
  );
}
