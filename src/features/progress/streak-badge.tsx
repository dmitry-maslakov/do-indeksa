import { FlameIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/auth";
import { getStreak } from "./streak";

export async function StreakBadge() {
  const session = await getSession();
  const days = session ? await getStreak(session.user.id) : 0;
  if (days === 0) return null;
  const t = await getTranslations("Home");

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
