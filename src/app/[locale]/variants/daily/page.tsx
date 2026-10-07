import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { belgradeDate } from "@/content/variants";
import { redirect } from "@/i18n/navigation";

export default async function DailyPage() {
  await connection();
  const locale = await getLocale();
  redirect({ href: `/variants/daily-${belgradeDate()}`, locale });
}
