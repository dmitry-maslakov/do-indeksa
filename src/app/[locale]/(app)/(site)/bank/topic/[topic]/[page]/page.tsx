import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  bankPageHref,
  pageCount,
  pageOf,
  pageOffset,
} from "@/features/bank/params";
import { findTasks } from "@/features/bank/search";
import { topicName, topics } from "@/features/catalog/topics";
import { alternates } from "@/i18n/alternates";
import { routing } from "@/i18n/routing";
import { Bank, BankResults } from "../../../_components/bank-results";

const pagesOf = (topic: string) =>
  topics.some((t) => t.id === topic)
    ? pageCount(findTasks({ topic }).length)
    : 0;

function pageIn(topic: string, value: string) {
  const page = pageOf(value);
  return page && page <= pagesOf(topic) ? page : undefined;
}

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const shells = topics.map(({ id }) => ({ topic: id, page: "2" }));
  return params.locale === routing.defaultLocale ? shells : shells.slice(0, 1);
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/bank/topic/[topic]/[page]">): Promise<Metadata> {
  const { topic, page: value } = await params;
  const page = pageIn(topic, value);
  if (!page) return {};
  const [meta, locale] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
  ]);
  const name = topicName(topic, locale);
  return {
    title: meta("bankTopicPage", { topic: name, page }),
    description: meta("bankTopicDescription", { topic: name }),
    alternates: alternates(bankPageHref(topic, page), locale),
  };
}

export default async function BankTopicPagePage({
  params,
  searchParams,
}: PageProps<"/[locale]/bank/topic/[topic]/[page]">) {
  const { topic, page: value } = await params;
  const page = pageIn(topic, value);
  if (!page) notFound();
  const offset = pageOffset(page);

  return (
    <Suspense
      fallback={
        <BankResults
          filters={{ topic }}
          tasks={findTasks({ topic })}
          offset={offset}
        />
      }
    >
      <Bank topic={topic} offset={offset} searchParams={searchParams} />
    </Suspense>
  );
}
