import { mapValues } from "es-toolkit";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { examGroups, firstOpenExam } from "@/features/catalog/exams";
import { officialYears } from "@/features/variants/variants";
import { currentWeekly } from "@/features/variants/weekly";
import { alternates } from "@/i18n/alternates";
import { getPathname } from "@/i18n/navigation";
import { repoUrl, siteUrl } from "@/lib/site";
import { Landing } from "./_components/landing";

async function describe() {
  const [t, format, locale] = await Promise.all([
    getTranslations("Landing"),
    getFormatter(),
    getLocale(),
  ]);
  const groups = examGroups(locale);
  const faculties = format.list(groups.map((g) => g.short));
  const years = officialYears(
    ...groups.flatMap((g) => g.exams.map((e) => e.id)),
  );
  return {
    title: t("metaTitle", {
      count: String(groups.length),
      faculties,
    }),
    description:
      years &&
      t("metaDescription", {
        faculties,
        years: t("years", mapValues(years, String)),
      }),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ title, description }, locale] = await Promise.all([
    describe(),
    getLocale(),
  ]);
  return {
    title: { absolute: title },
    description,
    alternates: alternates("/", locale),
  };
}

export default async function LandingPage() {
  const sample = firstOpenExam();
  const [weekly, meta, locale, { description }] = await Promise.all([
    currentWeekly(sample),
    getTranslations("Metadata"),
    getLocale(),
    describe(),
  ]);

  return (
    <>
      <Landing sample={sample} weekly={weekly} />
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
    </>
  );
}
