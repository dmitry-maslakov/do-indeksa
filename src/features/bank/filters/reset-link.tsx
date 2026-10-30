"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { queueEvent } from "@/lib/analytics-browser";

export function ResetLink({ className }: { className: string }) {
  const t = useTranslations("Bank");
  return (
    <Link
      href="/bank"
      className={className}
      onClick={() =>
        queueEvent("control_used", { control: "bank_filters_reset" })
      }
    >
      {t("reset")}
    </Link>
  );
}
