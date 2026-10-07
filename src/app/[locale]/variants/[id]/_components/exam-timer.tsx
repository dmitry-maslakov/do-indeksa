"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60) % 60).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${Math.floor(s / 3600)}:${mm}:${ss}`;
};

export function ExamTimer({
  startedAt,
  minutes,
}: {
  startedAt: number;
  minutes: number;
}) {
  const t = useTranslations("Exam");
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = startedAt + minutes * 60_000 - now;

  return (
    <div className="flex flex-col gap-0.5 px-1">
      <span className="text-sm text-subtle">
        {left >= 0 ? t("timeLeft") : t("overtime")}
      </span>
      <span
        role="timer"
        className={cn(
          "font-semibold text-3xl tabular-nums tracking-tight",
          left < 0 && "text-overtime-text",
        )}
      >
        {left < 0 && "+"}
        {clock(Math.abs(left))}
      </span>
    </div>
  );
}
