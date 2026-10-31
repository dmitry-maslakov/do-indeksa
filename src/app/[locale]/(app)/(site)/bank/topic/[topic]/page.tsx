import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { bankHref } from "@/features/bank/params";
import { findTasks } from "@/features/bank/search";
import { topicName, topics } from "@/features/catalog/topics";
import { alternates } from "@/i18n/alternates";
import { Bank, BankResults } from "../../_components/bank-results";

const known = (topic: string) => topics.some((t) => t.id === topic);

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/bank/topic/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  if (!known(topic)) return {};
  const [meta, locale] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
  ]);
  const name = topicName(topic, locale);
  return {
    title: meta("bankTopic", { topic: name }),
    description: meta("bankTopicDescription", { topic: name }),
    alternates: alternates(bankHref({ topic }), locale),
  };
}

export default async function BankTopicPage({
  params,
  searchParams,
}: PageProps<"/[locale]/bank/topic/[topic]">) {
  const { topic } = await params;
  if (!known(topic)) notFound();

  return (
    <Suspense
      fallback={
        <BankResults filters={{ topic }} tasks={findTasks({ topic })} />
      }
    >
      <Bank topic={topic} searchParams={searchParams} />
    </Suspense>
  );
}
