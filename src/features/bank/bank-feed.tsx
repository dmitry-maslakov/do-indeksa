"use client";

import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import type { FeedPage } from "./feed";
import { TaskCard } from "./task-card";
import { useBankFeed } from "./use-bank-feed";

interface LoadMoreProps {
  pending: boolean;
  onLoad: () => void;
}

function LoadMore({ pending, onLoad }: LoadMoreProps) {
  const t = useTranslations("Bank");
  const { ref } = useInView({
    rootMargin: "800px",
    onChange: (inView) => inView && onLoad(),
  });

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className="self-center"
      disabled={pending}
      onClick={onLoad}
    >
      {t("more")}
    </Button>
  );
}

interface BankFeedProps {
  search: string;
  first: FeedPage;
}

export function BankFeed({ search, first }: BankFeedProps) {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useBankFeed(
    search,
    first,
  );

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
          onLoad={() => fetchNextPage({ cancelRefetch: false })}
        />
      )}
    </>
  );
}
