import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { randomId } from "@/content/variants";
import { redirect } from "@/i18n/navigation";

export default async function RandomPage() {
  await connection();
  const locale = await getLocale();
  redirect({ href: `/variants/${randomId()}`, locale });
}
