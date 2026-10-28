"use client";

import { useTranslations } from "next-intl";
import { LoadMore } from "@/components/load-more";
import { type Page, useFeed } from "@/lib/use-feed";
import type { BankCard } from "./feed";
import { TaskCard } from "./task-card";

interface BankFeedProps {
  search: string;
  first: Page<BankCard>;
}

export function BankFeed({ search, first }: BankFeedProps) {
  const t = useTranslations("Bank");
  const feed = useFeed("/api/bank", first, search);

  return (
    <>
      {feed.data.pages
        .flatMap((page) => page.items)
        .map((card) => (
          <TaskCard key={card.id} card={card} />
        ))}
      <LoadMore key={feed.data.pages.length} feed={feed}>
        {t("more")}
      </LoadMore>
    </>
  );
}
