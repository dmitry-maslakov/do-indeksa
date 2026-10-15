import { useTranslations } from "next-intl";

export type ServerError = "unexpected" | "unauthorized";

export function useErrorText() {
  const t = useTranslations("Errors");
  return (error?: ServerError) => {
    if (error === "unauthorized") return t("unauthorized");
    return typeof navigator !== "undefined" && !navigator.onLine
      ? t("offline")
      : t("unexpected");
  };
}
