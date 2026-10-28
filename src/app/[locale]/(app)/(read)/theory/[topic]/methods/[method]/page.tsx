import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { topicName } from "@/features/catalog/topics";
import { getMethod, methodsOf, theoryMethods } from "@/features/theory/theory";
import {
  InlineMarkdown,
  TheoryMarkdown,
} from "@/features/theory/theory-markdown";
import { alternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { plain } from "@/lib/markdown";
import { Hero } from "../../_components/hero";
import { BackBar } from "../../_components/phone-nav";

export function generateStaticParams() {
  return theoryMethods.map((m) => ({ topic: m.topic, method: m.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/theory/[topic]/methods/[method]">): Promise<Metadata> {
  const { topic, method: slug } = await params;
  const method = getMethod(topic, slug);
  if (!method) return {};
  const [meta, locale] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
  ]);
  return {
    title: meta("theoryMethod", {
      method: plain(method.name),
      topic: topicName(topic, locale),
    }),
    description: meta("theoryMethodDescription", { when: plain(method.when) }),
    alternates: alternates(`/theory/${topic}/methods/${slug}`, locale),
  };
}

export default async function MethodPage({
  params,
}: PageProps<"/[locale]/theory/[topic]/methods/[method]">) {
  const { topic, method: slug } = await params;
  const method = getMethod(topic, slug);
  if (!method) notFound();
  const t = await getTranslations("Theory");
  const methods = methodsOf(topic);
  const index = methods.indexOf(method);
  const prev = methods[index - 1];
  const next = methods[index + 1];
  const href = (slug: string) => `/theory/${topic}/methods/${slug}`;

  return (
    <>
      <BackBar href={`/theory/${topic}/methods`} label={t("methods")} />
      <article className="flex flex-col gap-7.5">
        <Hero title={<InlineMarkdown source={method.name} />}>
          {t.rich("when", {
            hint: () => <InlineMarkdown source={method.when} />,
          })}
        </Hero>
        <TheoryMarkdown source={method.content} variant="method" />
        <nav className="flex justify-between gap-4 border-t pt-5.5 text-[15px] text-muted-foreground">
          {prev && (
            <Link
              href={href(prev.slug)}
              className="flex items-center gap-2 hover:text-foreground"
            >
              <ArrowLeftIcon aria-hidden="true" className="size-4 shrink-0" />
              <InlineMarkdown source={prev.name} />
            </Link>
          )}
          {next && (
            <Link
              href={href(next.slug)}
              className="ml-auto flex items-center gap-2 text-right hover:text-foreground"
            >
              <InlineMarkdown source={next.name} />
              <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          )}
        </nav>
      </article>
    </>
  );
}
