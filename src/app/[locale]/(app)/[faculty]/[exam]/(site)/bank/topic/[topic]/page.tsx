import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { bankHref } from "@/features/bank/params";
import { findTasks } from "@/features/bank/search";
import { examAt, inExam } from "@/features/catalog/exams";
import { topicName, topics } from "@/features/catalog/topics";
import { alternates } from "@/i18n/alternates";
import { Bank, BankResults } from "../../_components/bank-results";

const known = (topic: string) => topics.some((t) => t.id === topic);

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[faculty]/[exam]/bank/topic/[topic]">): Promise<Metadata> {
  const { topic, ...exam } = await params;
  if (!known(topic)) return {};
  const [meta, locale] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
  ]);
  const name = topicName(topic, locale);
  return {
    title: meta("bankTopic", { topic: name }),
    description: meta("bankTopicDescription", { topic: name }),
    alternates: alternates(inExam(examAt(exam), bankHref({ topic })), locale),
  };
}

export default async function BankTopicPage({
  params,
  searchParams,
}: PageProps<"/[locale]/[faculty]/[exam]/bank/topic/[topic]">) {
  const { topic, ...exam } = await params;
  if (!known(topic)) notFound();
  const examId = examAt(exam);

  return (
    <>
      <h1 className="sr-only">{topicName(topic, await getLocale())}</h1>
      <Suspense
        fallback={
          <BankResults
            examId={examId}
            filters={{ topic }}
            tasks={findTasks(examId, { topic })}
          />
        }
      >
        <Bank examId={examId} topic={topic} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
