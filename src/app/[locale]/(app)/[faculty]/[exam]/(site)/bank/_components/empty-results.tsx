import { useTranslations } from "next-intl";
import { ResetLink } from "@/features/bank/filters/reset-link";

export function EmptyResults() {
  const t = useTranslations("Bank");
  return (
    <p className="px-3 py-10 text-muted-foreground">
      {t("empty")}{" "}
      <ResetLink className="text-foreground underline decoration-1 underline-offset-3" />
    </p>
  );
}
