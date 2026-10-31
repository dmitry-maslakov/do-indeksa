"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { LoadMore } from "@/components/load-more";
import type { TaskStatuses } from "@/features/progress/status";
import { intentOf } from "@/lib/analytics-browser";
import { type Page, useFeed } from "@/lib/use-feed";
import type { BankCard } from "./feed";
import { useBankFilters } from "./filters/use-bank-filters";
import { loadBankFilters, serializeBankFilters } from "./params";
import { TaskCard } from "./task-card";

interface BankFeedProps {
  search: string;
  first: Page<BankCard>;
  statuses: Promise<TaskStatuses>;
}

export function BankFeed({ search, first, statuses }: BankFeedProps) {
  const t = useTranslations("Bank");
  const feed = useFeed("bank", first, search, true);
  const [filters] = useBankFilters();
  const changing = serializeBankFilters(filters) !== search;
  const via = loadBankFilters(search).q ? "search" : "list";

  return (
    <div
      aria-busy={changing}
      className={cn(
        "flex flex-col gap-3 transition-opacity",
        changing && "opacity-50",
      )}
    >
      {feed.data.pages
        .flatMap((page) => page.items)
        .map((card, i) => (
          <TaskCard
            key={card.id}
            card={card}
            statuses={statuses}
            intent={intentOf({ via, placement: "card", rank: i + 1 })}
          />
        ))}
      <LoadMore key={feed.data.pages.length} feed={feed}>
        {t("more")}
      </LoadMore>
    </div>
  );
}
