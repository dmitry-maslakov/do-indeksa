import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function EmptyResults() {
  const t = useTranslations("Bank");
  return (
    <p className="px-3 py-10 text-muted-foreground">
      {t("empty")}{" "}
      <Link
        href="/bank"
        className="text-foreground underline decoration-1 underline-offset-3"
      >
        {t("reset")}
      </Link>
    </p>
  );
}
