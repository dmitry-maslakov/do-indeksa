import { io } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { belgradeDate } from "@/lib/dates";

export const instant = false;

export default async function DailyPage() {
  await io();
  const locale = await getLocale();
  redirect({ href: `/variants/daily-${belgradeDate()}`, locale });
}
