import { useTranslations } from "next-intl";

export function useErrorText() {
  const t = useTranslations("Errors");
  return () =>
    typeof navigator !== "undefined" && !navigator.onLine
      ? t("offline")
      : t("unexpected");
}
