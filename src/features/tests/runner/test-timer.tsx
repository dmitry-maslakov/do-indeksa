"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { minuteMs, secondMs } from "@/lib/dates";
import type { LocalTest } from "./test-store";

type Timing = Pick<LocalTest, "startedAt" | "minutes">;

const format = (ms: number) => {
  const s = Math.floor(ms / secondMs);
  const mm = String(Math.floor(s / 60) % 60).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${Math.floor(s / 3600)}:${mm}:${ss}`;
};

export function useClock({ startedAt, minutes }: Timing) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = startedAt + minutes * minuteMs - now;
  const over = left < 0;
  return { over, text: `${over ? "+" : ""}${format(Math.abs(left))}` };
}

export function TimeUp({ className }: { className?: string }) {
  const t = useTranslations("Exam");
  return (
    <p role="alert" className={cn("text-[13px] text-overtime-text", className)}>
      {t("timeUp")}
    </p>
  );
}

export function TestTimer({ timing }: { timing: Timing }) {
  const t = useTranslations("Exam");
  const { over, text } = useClock(timing);
  const [hidden, setHidden] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold text-muted-foreground text-xs">
            {over ? t("overtime") : t("timeLeft")}
          </span>
          {!hidden && (
            <span
              role="timer"
              className={cn(
                "font-semibold text-[34px] leading-[1.1] tabular-nums tracking-tight",
                over && "text-overtime-text",
              )}
            >
              {text}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setHidden(!hidden)}
          className={cn(
            "rounded-sm text-[13px] text-subtle outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            !hidden && "mb-2",
          )}
        >
          {hidden ? t("showTime") : t("hideTime")}
        </button>
      </div>
      {over && <TimeUp />}
    </div>
  );
}
