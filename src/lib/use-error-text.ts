import { useTranslations } from "next-intl";

export type ServerError = "unexpected" | "bot";

export function useErrorText() {
  const t = useTranslations("Errors");
  return () =>
    typeof navigator !== "undefined" && !navigator.onLine
      ? t("offline")
      : t("unexpected");
}
