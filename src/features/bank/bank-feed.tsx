"use client";

import { cn } from "cn";
import { noop } from "es-toolkit";
import { useTranslations } from "next-intl";
import { type ReactNode, useSyncExternalStore } from "react";
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
  statuses?: Promise<TaskStatuses>;
}

interface ListProps {
  busy: boolean;
  children: ReactNode;
}

function List({ busy, children }: ListProps) {
  return (
    <div
      aria-busy={busy}
      className={cn(
        "flex flex-col gap-3 transition-opacity",
        busy && "opacity-50",
      )}
    >
      {children}
    </div>
  );
}

interface UrlListProps {
  search: string;
  children: ReactNode;
}

function UrlList({ search, children }: UrlListProps) {
  const [filters] = useBankFilters();
  return (
    <List busy={serializeBankFilters(filters) !== search}>{children}</List>
  );
}

export function BankFeed({ search, first, statuses }: BankFeedProps) {
  const t = useTranslations("Bank");
  const feed = useFeed("bank", first, search, true);
  const hydrated = useSyncExternalStore(
    () => noop,
    () => true,
    () => false,
  );
  const via = loadBankFilters(search).q ? "search" : "list";
  const cards = (
    <>
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
    </>
  );

  return hydrated ? (
    <UrlList search={search}>{cards}</UrlList>
  ) : (
    <List busy={false}>{cards}</List>
  );
}
