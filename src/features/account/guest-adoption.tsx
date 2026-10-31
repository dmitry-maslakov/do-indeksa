"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { adoptGuestCookie, readCookie } from "@/lib/cookies";
import { adoptGuest } from "./actions";

export function GuestAdoption() {
  const t = useTranslations("UserMenu");
  useEffect(() => {
    if (!readCookie(adoptGuestCookie)) return;
    adoptGuest().then((result) => {
      if (result?.data) toast.success(t("merged"));
    });
  }, [t]);
  return null;
}
