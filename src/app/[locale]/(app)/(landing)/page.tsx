import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import {
  examChoice,
  firstOpenExam,
  openFaculties,
} from "@/features/catalog/exams";
import { officialYears } from "@/features/variants/variants";
import { currentWeekly } from "@/features/variants/weekly";
import { alternates } from "@/i18n/alternates";
import { getPathname } from "@/i18n/navigation";
import { repoUrl, siteUrl } from "@/lib/site";
import { Landing } from "./_components/landing";

function paperYears() {
  const spans = examChoice.flatMap((e) => officialYears(e.id) ?? []);
  if (spans.length === 0) return undefined;
  return {
    first: String(Math.min(...spans.map((s) => s.first))),
    last: String(Math.max(...spans.map((s) => s.last))),
  };
}

async function describe() {
  const [t, format] = await Promise.all([
    getTranslations("Landing"),
    getFormatter(),
  ]);
  const faculties = format.list(openFaculties.map((f) => f.short));
  const years = paperYears();
  return {
    title: t("metaTitle", {
      count: String(openFaculties.length),
      faculties,
    }),
    description:
      years && t("metaDescription", { faculties, years: t("years", years) }),
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
