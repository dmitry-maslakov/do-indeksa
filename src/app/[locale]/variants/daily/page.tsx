import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { belgradeDate } from "@/lib/dates";

export default async function DailyPage() {
  await connection();
  const locale = await getLocale();
  redirect({ href: `/variants/daily-${belgradeDate()}`, locale });
}
