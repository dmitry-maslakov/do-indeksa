import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="px-4 pt-10 pb-6 text-[13px] text-subtle exam-running:hidden max-md:task-focus:hidden lg:px-10">
      <Link
        href="/privacy"
        className="underline-offset-4 hover:text-foreground hover:underline"
      >
        {t("privacy")}
      </Link>
    </footer>
  );
}
