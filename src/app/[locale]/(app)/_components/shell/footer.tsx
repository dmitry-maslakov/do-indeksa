import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const linkClass = "underline-offset-4 hover:text-foreground hover:underline";

export function Footer({ className }: { className?: string }) {
  const t = useTranslations("Footer");

  return (
    <footer
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-2 px-4 pt-10 pb-6 text-[13px] text-subtle lg:px-10",
        className,
      )}
    >
      <Link href="/privacy" exam={null} className={linkClass}>
        {t("privacy")}
      </Link>
      <Link href="/terms" exam={null} className={linkClass}>
        {t("terms")}
      </Link>
      <span>{t("unofficial")}</span>
    </footer>
  );
}
