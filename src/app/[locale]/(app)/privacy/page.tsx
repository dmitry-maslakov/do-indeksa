import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { alternates } from "@/i18n/alternates";
import { repoUrl } from "@/lib/site";
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
    <main className="flex flex-col gap-4 px-4 pt-4 pb-6 md:gap-5 md:px-10 md:pt-6 md:pb-8">
      <h1 className="font-bold text-2xl tracking-tight md:text-3xl">
        {t("title")}
      </h1>
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
                  href={`${repoUrl}/issues`}
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
    <section className="flex flex-col items-start gap-3 rounded-xl border bg-card px-5 py-6">
      <h2 className="font-semibold text-lg tracking-tight">{title}</h2>
      {lines?.map((line) => (
        <p key={line} className="text-sm text-subtle">
          {line}
        </p>
      ))}
      {children}
    </section>
  );
}
