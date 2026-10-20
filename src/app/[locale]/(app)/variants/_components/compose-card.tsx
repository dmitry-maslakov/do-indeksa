"use client";

import { isEqual } from "es-toolkit";
import { useTranslations } from "next-intl";
import { Suspense, use, useState } from "react";
import { Button } from "@/components/ui/button";
import { TopicGlyph } from "@/features/tasks/topic-icon";
import type { TopicLook } from "@/features/tasks/topic-look";
import { useRouter } from "@/i18n/navigation";

const counts = [5, 10];

interface ComposeCardProps {
  topics: { id: string; name: string; look: TopicLook }[];
  weak: Promise<string[]>;
}

const quick =
  "rounded-sm font-medium text-data focus-visible:outline-2 focus-visible:outline-ring aria-pressed:cursor-default aria-pressed:text-subtle";

export function ComposeCard({ topics, weak }: ComposeCardProps) {
  const t = useTranslations("Compose");
  const router = useRouter();
  const all = topics.map((topic) => topic.id);
  const [chosen, setChosen] = useState(all);
  const [count, setCount] = useState(10);
  const flip = (id: string) =>
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const only = (ids: string[]) => isEqual([...chosen].sort(), [...ids].sort());

  function start() {
    const everything = chosen.length === all.length;
    const query = new URLSearchParams({
      mode: everything ? "exam" : "topics",
      count: String(count),
    });
    if (!everything) for (const id of chosen) query.append("topic", id);
    router.push(`/variants/compose?${query}`);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card px-5 py-6">
      <h2 className="font-semibold text-lg tracking-tight">{t("title")}</h2>
      <p className="-mt-2 text-subtle text-xs">{t("hint")}</p>
      <div className="grid grid-cols-5 gap-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            aria-pressed={chosen.includes(topic.id)}
            aria-label={topic.name}
            title={topic.name}
            onClick={() => flip(topic.id)}
            className="flex h-10 items-center justify-center rounded-lg bg-muted font-bold text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-data-tint aria-pressed:text-data [&_svg]:size-4"
          >
            <TopicGlyph icon={topic.look.icon} size="sm" />
          </button>
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        <Suspense>
          <WeakButton weak={weak} only={only} onPick={setChosen} />
        </Suspense>
        <button
          type="button"
          aria-pressed={chosen.length === all.length}
          onClick={() => setChosen(all)}
          className={quick}
        >
          {t("all")}
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-sm text-subtle">
          {counts.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={count === n}
              onClick={() => setCount(n)}
              className="h-9 w-10 rounded-lg font-semibold text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              {n}
            </button>
          ))}
          <span className="ml-1">{t("tasks")}</span>
        </div>
        <Button
          variant="lime"
          size="sm"
          className="h-10 disabled:opacity-35"
          disabled={chosen.length === 0}
          onClick={start}
        >
          {t("start")}
        </Button>
      </div>
    </section>
  );
}

interface WeakButtonProps {
  weak: Promise<string[]>;
  only: (ids: string[]) => boolean;
  onPick: (ids: string[]) => void;
}

function WeakButton({ weak, only, onPick }: WeakButtonProps) {
  const t = useTranslations("Compose");
  const ids = use(weak);
  if (ids.length === 0) return null;
  return (
    <button
      type="button"
      aria-pressed={only(ids)}
      onClick={() => onPick(ids)}
      className={quick}
    >
      {t("weak")}
    </button>
  );
}
