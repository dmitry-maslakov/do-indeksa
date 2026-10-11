import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/page-title";
import { Card, CardTitle } from "@/components/ui/card";
import { alternates } from "@/i18n/alternates";
import { DeleteAccount } from "./_components/delete-account";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Privacy");
  return {
    title: t("title"),
    alternates: alternates("/privacy", await getLocale()),
  };
}

export default function PrivacyPage() {
  const t = useTranslations("Privacy");

  return (
    <main className="px-4 pb-9 md:px-9">
      <PageTitle>{t("title")}</PageTitle>
      <div className="grid max-w-2xl gap-4">
        <Section
          title={t("storedTitle")}
          lines={[
            t("account"),
            t("session"),
            t("progress"),
            t("reports"),
            t("why"),
            t("googleOnly"),
          ]}
        />
        <Section title={t("guestTitle")} lines={[t("guest")]} />
        <Section title={t("trackingTitle")} lines={[t("tracking")]} />
        <Section title={t("deleteTitle")} lines={[t("delete")]}>
          <DeleteAccount />
        </Section>
        <Section title={t("contactTitle")}>
          <p className="text-sm text-subtle">
            {t.rich("contact", {
              link: (chunks) => (
                <a
                  href="https://github.com/dmitry-maslakov/do-indeksa/issues"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  lines,
  children,
}: {
  title: string;
  lines?: string[];
  children?: ReactNode;
}) {
  return (
    <Card className="items-start gap-3">
      <CardTitle>{title}</CardTitle>
      {lines?.map((line) => (
        <p key={line} className="text-sm text-subtle">
          {line}
        </p>
      ))}
      {children}
    </Card>
  );
}
