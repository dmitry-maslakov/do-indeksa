"use client";

import { FlameIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getStreak } from "@/server/streak";

export function StreakBadge() {
  const t = useTranslations("Home");
  const { data: session } = authClient.useSession();
  const [days, setDays] = useState(0);

  useEffect(() => {
    if (session) getStreak().then(setDays);
  }, [session]);

  if (days === 0) return null;
  return (
    <span
      title={t("streak", { count: days })}
      className="flex h-9 items-center gap-1 rounded-full bg-overtime-tint px-3 font-semibold text-overtime-text text-sm"
    >
      <FlameIcon className="size-4" />
      {days}
    </span>
  );
}
