"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { adoptGuest } from "./actions";

export function GuestAdoption() {
  const t = useTranslations("UserMenu");
  useEffect(() => {
    adoptGuest().then((result) => {
      if (result?.data) toast.success(t("merged"));
    });
  }, [t]);
  return null;
}
