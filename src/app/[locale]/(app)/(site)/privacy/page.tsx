import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/page-title";
import { alternates } from "@/i18n/alternates";
import { contactEmail } from "@/lib/site";
import { AnalyticsToggle } from "./_components/analytics-toggle";
import { DeleteAccount } from "./_components/delete-account";

const poverenikUrl = "https://www.poverenik.rs";
const linkClass = "underline underline-offset-3 hover:text-subtle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Privacy");
  return {
    title: t("title"),
    alternates: alternates("/privacy", await getLocale()),
  };
}

export default function PrivacyPage() {
  const t = useTranslations("Privacy");
  const links = {
    email: contactEmail,
    mail: (chunks: ReactNode) => (
      <a href={`mailto:${contactEmail}`} className={linkClass}>
        {chunks}
      </a>
    ),
    poverenik: (chunks: ReactNode) => (
      <a href={poverenikUrl} className={linkClass}>
        {chunks}
      </a>
    ),
  };

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle className="pt-4 pb-5">{t("title")}</PageTitle>
      <article className="grid max-w-2xl gap-6 text-sm leading-relaxed">
        <p className="text-subtle">{t("updated")}</p>
        <Section title={t("controllerTitle")}>
          <p>{t.rich("controller", links)}</p>
        </Section>
        <Section title={t("storedTitle")}>
          <ul className="grid list-disc gap-1.5 pl-5">
            <li>{t("storedGuest")}</li>
            <li>{t("storedAccount")}</li>
            <li>{t("storedErrors")}</li>
          </ul>
        </Section>
        <Section title={t("purposeTitle")}>
          <p>{t("purpose")}</p>
        </Section>
        <Section title={t("recipientsTitle")}>
          <p>{t("recipients")}</p>
        </Section>
        <Section title={t("retentionTitle")}>
          <p>{t("retention")}</p>
        </Section>
        <Section title={t("cookiesTitle")}>
          <p>{t("cookies")}</p>
        </Section>
        <Section title={t("analyticsTitle")}>
          <p>{t("analytics")}</p>
          <p>{t("analyticsOff")}</p>
          <AnalyticsToggle />
        </Section>
        <Section title={t("rightsTitle")}>
          <p>{t.rich("rights", links)}</p>
          <DeleteAccount />
        </Section>
        <Section title={t("minorsTitle")}>
          <p>{t("minors")}</p>
        </Section>
        <Section title={t("changesTitle")}>
          <p>{t("changes")}</p>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-2">
      <h2 className="font-semibold text-base">{title}</h2>
      {children}
    </section>
  );
}
