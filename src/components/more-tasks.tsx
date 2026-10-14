"use client";

import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import type { BankFilters } from "@/content/bank";
import { loadBankTasks } from "@/server/bank";

interface MoreTasksProps {
  filters: BankFilters;
  next: number;
}

export function MoreTasks({ filters, next: first }: MoreTasksProps) {
  const t = useTranslations("Bank");
  const [cards, setCards] = useState<ReactNode[]>([]);
  const [next, setNext] = useState<number | null>(first);
  const [pending, startTransition] = useTransition();
  const more = useRef<HTMLButtonElement>(null);

  const load = () => {
    if (next === null || pending) return;
    startTransition(async () => {
      const page = await loadBankTasks(filters, next);
      setCards((shown) => [...shown, ...page.cards]);
      setNext(page.next);
    });
  };
  const onVisible = useEffectEvent(load);

  useEffect(() => {
    if (!more.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && onVisible(),
      { rootMargin: "800px" },
    );
    observer.observe(more.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {cards}
      {next !== null && (
        <Button
          ref={more}
          variant="ghost"
          size="sm"
          className="self-center"
          disabled={pending}
          onClick={load}
        >
          {t("more")}
        </Button>
      )}
    </>
  );
}
