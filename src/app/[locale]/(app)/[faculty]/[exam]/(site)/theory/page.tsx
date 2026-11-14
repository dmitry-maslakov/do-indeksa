import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/page-title";
import { examAt, inExam } from "@/features/catalog/exams";
import { TopicIcon } from "@/features/catalog/topic-icon";
import { toneStyle } from "@/features/catalog/topic-look";
import { topicLook, topicName } from "@/features/catalog/topics";
import { methodsOf, theoriesOf } from "@/features/theory/theory";
import { alternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/theory">): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const href = inExam(examAt(await params), "/theory");
  return {
    title: t("theoryTitle"),
    description: t("theoryDescription"),
    alternates: alternates(href, await getLocale()),
  };
}

export default async function TheoryPage({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/theory">) {
  const t = await getTranslations("Theory");
  const locale = await getLocale();
  const examId = examAt(await params);

  return (
    <main className="px-4 pb-9 md:px-10 md:pb-14">
      <PageTitle className="pt-4 pb-2 md:pt-6 md:text-4xl">
        {t("title")}
      </PageTitle>
      <p className="pb-6 text-muted-foreground md:pb-7 md:text-[17px]">
        {t("lead")}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {theoriesOf(examId).map(({ topic, sections }) => {
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
