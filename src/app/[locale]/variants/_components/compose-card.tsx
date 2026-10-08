"use client";

import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { useRouter } from "@/i18n/navigation";
import { composeModes } from "@/lib/compose";

export function ComposeCard({
  topics,
}: {
  topics: { id: string; name: string }[];
}) {
  const t = useTranslations("Compose");
  const router = useRouter();
  const [mode, setMode] = useState<(typeof composeModes)[number]>("exam");
  const [chosen, setChosen] = useState<string[]>([]);

  function compose() {
    const query = new URLSearchParams({ mode });
    if (mode === "topics") for (const id of chosen) query.append("topic", id);
    router.push(`/variants/compose?${query}`);
  }

  return (
    <Card className="gap-4">
      <CardTitle>{t("title")}</CardTitle>
      <fieldset className="flex flex-col gap-1.5 text-sm">
        {composeModes.map((m) => (
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
          {topics.map((topic) => (
            <Toggle
              key={topic.id}
              pressed={chosen.includes(topic.id)}
              onPressedChange={(on) =>
                setChosen((c) =>
                  on ? [...c, topic.id] : c.filter((x) => x !== topic.id),
                )
              }
            >
              {topic.name}
            </Toggle>
          ))}
        </div>
      )}
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
