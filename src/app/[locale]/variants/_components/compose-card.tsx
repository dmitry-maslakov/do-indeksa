"use client";

import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

const modes = ["exam", "weak", "unsolved", "topics"] as const;

interface ComposeCardProps {
  topics: { id: string; name: string }[];
  minutes: number;
}

export function ComposeCard({ topics, minutes }: ComposeCardProps) {
  const t = useTranslations("Compose");
  const router = useRouter();
  const [mode, setMode] = useState<(typeof modes)[number]>("exam");
  const [chosen, setChosen] = useState<string[]>([]);
  const [timer, setTimer] = useState(true);

  function compose() {
    const query = new URLSearchParams({ mode });
    if (mode === "topics") for (const id of chosen) query.append("topic", id);
    if (!timer) query.set("timer", "off");
    router.push(`/variants/compose?${query}`);
  }

  return (
    <Card className="gap-4">
      <CardTitle>{t("title")}</CardTitle>
      <fieldset className="flex flex-col gap-1.5 text-sm">
        {modes.map((m) => (
          <label
            key={m}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
              mode === m
                ? "bg-muted font-medium"
                : "text-subtle hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === m}
              onChange={() => setMode(m)}
              className="sr-only"
            />
            {t(m)}
            {mode === m && <CheckIcon className="size-4" />}
          </label>
        ))}
      </fieldset>
      {mode === "topics" && (
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => {
            const on = chosen.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setChosen((c) =>
                    on ? c.filter((x) => x !== topic.id) : [...c, topic.id],
                  )
                }
                className={cn(
                  "rounded-full px-3 py-1 text-[13px] transition-colors",
                  on
                    ? "bg-data-tint text-data"
                    : "bg-muted text-subtle hover:text-foreground",
                )}
              >
                {topic.name}
              </button>
            );
          })}
        </div>
      )}
      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
        {t("timer", { minutes })}
        <input
          type="checkbox"
          checked={timer}
          onChange={(e) => setTimer(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative h-6 w-10 rounded-full bg-untouched transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-card after:shadow-sm after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
        />
      </label>
      <Button
        variant="secondary"
        className="w-full"
        disabled={mode === "topics" && chosen.length === 0}
        onClick={compose}
      >
        {t("compose")}
      </Button>
    </Card>
  );
}
