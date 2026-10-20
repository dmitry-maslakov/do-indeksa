"use client";

import { useTranslations } from "next-intl";
import { LoadMore } from "@/components/load-more";
import type { FeedPage } from "./feed";
import { TaskCard } from "./task-card";
import { useBankFeed } from "./use-bank-feed";

interface BankFeedProps {
  search: string;
  first: FeedPage;
}

export function BankFeed({ search, first }: BankFeedProps) {
  const t = useTranslations("Bank");
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useBankFeed(search, first);

  return (
    <>
      {data.pages
        .flatMap((page) => page.cards)
        .map((card) => (
          <TaskCard key={card.id} card={card} />
        ))}
      {hasNextPage && (
        <LoadMore
          key={data.pages.length}
          pending={isFetchingNextPage}
          failed={isFetchNextPageError}
          onLoad={() => fetchNextPage({ cancelRefetch: false })}
        >
          {t("more")}
        </LoadMore>
      )}
    </>
  );
}
