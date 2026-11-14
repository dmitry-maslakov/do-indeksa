"use client";

import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { adoptGuestCookie, readCookie } from "@/lib/cookies";
import { adoptGuest } from "./actions";

export function GuestAdoption() {
  const t = useTranslations("UserMenu");
  const merged = useEffectEvent(() => toast.success(t("merged")));
  useEffect(() => {
    if (!readCookie(adoptGuestCookie)) return;
    adoptGuest().then((result) => {
      if (result?.data) merged();
    });
  }, []);
  return null;
}
