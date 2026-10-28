import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { repoUrl } from "@/lib/site";

const linkClass = "underline-offset-4 hover:text-foreground hover:underline";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="flex flex-wrap gap-x-5 gap-y-2 px-4 pt-10 pb-6 text-[13px] text-subtle exam-running:hidden max-md:task-focus:hidden lg:px-10">
      <Link href="/privacy" className={linkClass}>
        {t("privacy")}
      </Link>
      <Link href="/terms" className={linkClass}>
        {t("terms")}
      </Link>
      <a href={repoUrl} className={linkClass}>
        {t("source")}
      </a>
      <span>{t("unofficial")}</span>
    </footer>
  );
}
