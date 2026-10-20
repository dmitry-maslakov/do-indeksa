"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { adoptGuest } from "./adopt-action";

export function GuestAdoption() {
  const t = useTranslations("UserMenu");
  const router = useRouter();
  useEffect(() => {
    adoptGuest().then((result) => {
      if (result?.data) toast.success(t("merged"));
      router.refresh();
    });
  }, [router, t]);
  return null;
}
