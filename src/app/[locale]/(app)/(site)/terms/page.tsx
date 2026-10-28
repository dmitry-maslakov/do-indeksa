import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/page-title";
import { alternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { contactEmail, repoUrl } from "@/lib/site";

const licenseUrl = "https://creativecommons.org/licenses/by-nc-sa/4.0/";
const linkClass = "underline underline-offset-3 hover:text-subtle";
const items = [
  "service",
  "results",
  "account",
  "content",
  "rules",
  "liability",
  "changes",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Terms");
  return {
    title: t("title"),
    alternates: alternates("/terms", await getLocale()),
  };
}

export default function TermsPage() {
  const t = useTranslations("Terms");
  const links = {
    email: contactEmail,
    mail: (chunks: ReactNode) => (
      <a href={`mailto:${contactEmail}`} className={linkClass}>
        {chunks}
      </a>
    ),
    privacy: (chunks: ReactNode) => (
      <Link href="/privacy" className={linkClass}>
        {chunks}
      </Link>
    ),
    cc: (chunks: ReactNode) => (
      <a href={licenseUrl} className={linkClass}>
        {chunks}
      </a>
    ),
    mit: (chunks: ReactNode) => (
      <a href={`${repoUrl}/blob/main/LICENSE`} className={linkClass}>
        {chunks}
      </a>
    ),
  };

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle className="pt-4 pb-5">{t("title")}</PageTitle>
      <article className="grid max-w-2xl gap-6 text-sm leading-relaxed">
        <p className="text-subtle">{t("updated")}</p>
        <ol className="grid list-decimal gap-3 pl-5">
          {items.map((item) => (
            <li key={item}>{t.rich(item, links)}</li>
          ))}
        </ol>
      </article>
    </main>
  );
}
