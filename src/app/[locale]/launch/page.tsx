import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { Badge } from "@/components/ui/badge";
import { tasks } from "@/content/tasks";
import { curatedVariants, officialVariants } from "@/content/variants";
import { alternates } from "@/i18n/alternates";
import { getPathname } from "@/i18n/navigation";
import { repoUrl, siteUrl } from "@/lib/site";
import { ExamSheet } from "./_components/exam-sheet";

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

const years = officialVariants.flatMap((v) => v.year ?? []);

const hinted = tasks.filter((task) => task.hints.length > 0).length;

export default function LaunchPage() {
  const t = useTranslations("Launch");
  const meta = useTranslations("Metadata");
  const locale = useLocale();
  const description = meta("launchDescription");

  return (
    <main className="px-4 pb-9 md:px-9">
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
      <section className="grid content-center gap-6 overflow-hidden rounded-3xl bg-daily px-5 py-8 text-white *:animate-in *:fill-mode-backwards *:fade-in *:slide-in-from-bottom-3 *:duration-700 *:motion-reduce:animate-none md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-x-12 md:p-12">
        <div className="flex flex-col gap-4">
          <p className="font-semibold text-daily-muted text-sm">
            {t("eyebrow")}
          </p>
          <h1 className="font-bold text-[32px] leading-[1.1] tracking-[-0.02em] md:text-display">
            {t("title")}
          </h1>
          <p className="max-w-xl text-daily-muted md:text-lg">{t("lead")}</p>
          <Badge variant="tint">{t("soon")}</Badge>
        </div>
        <ul className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 delay-200 sm:grid-cols-3">
          <Fact
            value={years.length}
            label={t("exams", {
              count: years.length,
              from: String(years.at(-1)),
              to: String(years.at(0)),
            })}
          />
          <Fact
            value={curatedVariants.length}
            label={t("tests", { count: curatedVariants.length })}
          />
          <Fact value={hinted} label={t("tasks", { count: hinted })} />
        </ul>
        <ExamSheet />
        <p className="text-daily-muted text-sm delay-300">
          {t.rich("open", {
            link: (chunks) => (
              <a
                href={repoUrl}
                className="text-white underline underline-offset-4"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </section>
    </main>
  );
}

function Fact({ value, label }: { value: number; label: string }) {
  return (
    <li className="col-span-2 grid grid-cols-subgrid items-baseline sm:col-span-1 sm:flex sm:flex-col sm:gap-1">
      <span className="font-bold text-[28px] tabular-nums leading-none sm:text-[32px]">
        {value}
      </span>
      <span className="text-daily-muted text-sm">{label}</span>
    </li>
  );
}
