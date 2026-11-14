import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

const linkClass = "underline-offset-4 hover:text-foreground hover:underline";

interface FooterProps {
  note?: ReactNode;
  className?: string;
}

export function Footer({ note, className }: FooterProps) {
  const t = useTranslations("Footer");

  return (
    <footer
      className={cn(
        "flex flex-wrap items-baseline gap-x-5 gap-y-2 px-4 pt-10 pb-6 text-[13px] text-subtle lg:px-10",
        className,
      )}
    >
      {note && (
        <p className="mr-auto max-w-230 font-medium text-foreground text-sm leading-normal">
          {note}
        </p>
      )}
      <Link href="/privacy" exam={null} className={linkClass}>
        {t("privacy")}
      </Link>
      <Link href="/terms" exam={null} className={linkClass}>
        {t("terms")}
      </Link>
      {!note && <span>{t("unofficial")}</span>}
    </footer>
  );
}
