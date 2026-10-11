import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { alternates } from "@/i18n/alternates";
import { getPathname } from "@/i18n/navigation";
import { repoUrl, siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const locale = await getLocale();
  const title = t("launchTitle");
  const description = t("launchDescription");
  return {
    title: { absolute: title },
    description,
    alternates: alternates("/", locale),
    openGraph: {
      type: "website",
      siteName: t("title"),
      title,
      description,
      url: getPathname({ href: "/", locale }),
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function LaunchPage() {
  const t = useTranslations("Launch");
  const meta = useTranslations("Metadata");
  const locale = useLocale();
  const description = meta("launchDescription");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: meta("title"),
              url: new URL(getPathname({ href: "/", locale }), siteUrl).href,
              inLanguage: locale,
              description,
            },
            {
              "@type": "EducationalOrganization",
              name: meta("title"),
              url: siteUrl.href,
              description,
              areaServed: "RS",
              sameAs: [repoUrl],
            },
          ],
        }}
      />
      <h1 className="max-w-[13ch] font-semibold text-[30px] leading-[1.12] tracking-[-0.025em] sm:max-w-[16ch] sm:text-[44px]">
        {t("title")}
      </h1>
      <p className="mt-4.5 max-w-[30ch] text-[15px] text-daily-muted sm:max-w-none sm:text-base">
        {t("lead")}
      </p>
      <time
        dateTime="2026-11"
        className="mt-10 text-[13px] text-daily-muted/80 uppercase tracking-[0.18em]"
      >
        {t("date")}
      </time>
    </main>
  );
}
