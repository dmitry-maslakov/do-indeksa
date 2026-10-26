import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/page-title";
import { TopicIcon } from "@/features/tasks/topic-icon";
import { toneStyle } from "@/features/tasks/topic-look";
import { topicLook, topicName } from "@/features/tasks/topics";
import { methodsOf, theories } from "@/features/theory/theory";
import { alternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("theoryTitle"),
    description: t("theoryDescription"),
    alternates: alternates("/theory", await getLocale()),
  };
}

export default function TheoryPage() {
  const t = useTranslations("Theory");
  const locale = useLocale();

  return (
    <main className="px-4 pb-9 md:px-10 md:pb-14">
      <PageTitle className="pb-2 md:pt-6 md:text-4xl">{t("title")}</PageTitle>
      <p className="pb-6 text-muted-foreground md:pb-7 md:text-[17px]">
        {t("lead")}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {theories.map(({ topic, sections }) => {
          const look = topicLook(topic);
          return (
            <li key={topic}>
              <Link
                href={`/theory/${topic}`}
                style={toneStyle(look.tone)}
                className="flex h-full items-center gap-4 rounded-3xl bg-(--tint) p-4.5"
              >
                <TopicIcon {...look} size="lg" />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-semibold text-[17px] leading-[1.3]">
                    {topicName(topic, locale)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {t("counts", {
                      sections: sections.length,
                      methods: methodsOf(topic).length,
                    })}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
