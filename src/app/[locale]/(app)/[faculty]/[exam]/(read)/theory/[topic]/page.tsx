import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { canonicalHref, examAt } from "@/features/catalog/exams";
import { topicName } from "@/features/catalog/topics";
import { getTheory, methodsOf, theoriesOf } from "@/features/theory/theory";
import { TheoryMarkdown } from "@/features/theory/theory-markdown";
import { untranslated } from "@/i18n/alternates";
import { TopicHero } from "./_components/hero";
import { BackBar, PhoneTabs } from "./_components/phone-nav";
import { TheoryArticle } from "./_components/theory-article";

export function generateStaticParams({
  params,
}: {
  params: { faculty: string; exam: string };
}) {
  return theoriesOf(examAt(params)).map((t) => ({ topic: t.topic }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/theory/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  const theory = getTheory(topic);
  if (!theory) return {};
  const [meta, locale] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
  ]);
  const name = topicName(topic, locale);
  return {
    title: meta("theoryTopic", { topic: name }),
    description: meta("theoryTopicDescription", {
      topic: name,
      sections: theory.sections.map((s) => s.title).join(", "),
    }),
    ...untranslated(canonicalHref(topic, `/theory/${topic}`), locale),
  };
}

export default async function TheoryTopicPage({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/theory/[topic]">) {
  const { topic, ...exam } = await params;
  const theory = getTheory(topic);
  if (!theory) notFound();
  const t = await getTranslations("Theory");

  return (
    <>
      <BackBar href="/theory" label={t("title")} />
      <TheoryArticle
        topic={topic}
        page="topic"
        className="flex flex-col gap-7.5 md:gap-10"
      >
        <TopicHero examId={examAt(exam)} topic={topic} />
        <PhoneTabs
          topic={topic}
          methods={methodsOf(topic).length}
          active="theory"
        />
        <TheoryMarkdown
          source={theory.content}
          images={theory.images}
          variant="topic"
        />
      </TheoryArticle>
    </>
  );
}
