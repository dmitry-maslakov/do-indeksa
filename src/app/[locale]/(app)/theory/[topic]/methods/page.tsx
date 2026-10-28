import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { topicName } from "@/features/catalog/topics";
import { getTheory, methodsOf, theories } from "@/features/theory/theory";
import { InlineMarkdown } from "@/features/theory/theory-markdown";
import { alternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { plain } from "@/lib/markdown";
import { TopicHero } from "../_components/hero";
import { BackBar, PhoneTabs } from "../_components/phone-nav";

export function generateStaticParams() {
  return theories.map((t) => ({ topic: t.topic }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/theory/[topic]/methods">): Promise<Metadata> {
  const { topic } = await params;
  if (!getTheory(topic)) return {};
  const [meta, locale] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
  ]);
  const name = topicName(topic, locale);
  return {
    title: meta("theoryMethods", { topic: name }),
    description: meta("theoryMethodsDescription", {
      topic: name,
      methods: methodsOf(topic)
        .map((m) => plain(m.name))
        .join(", "),
    }),
    alternates: alternates(`/theory/${topic}/methods`, locale),
  };
}

export default async function MethodsPage({
  params,
}: PageProps<"/[locale]/theory/[topic]/methods">) {
  const { topic } = await params;
  if (!getTheory(topic)) notFound();
  const t = await getTranslations("Theory");
  const methods = methodsOf(topic);

  return (
    <>
      <BackBar href="/theory" label={t("title")} />
      <article className="flex flex-col gap-5.5 md:gap-10">
        <TopicHero topic={topic} />
        <PhoneTabs topic={topic} methods={methods.length} active="methods" />
        <ul className="flex flex-col gap-2">
          {methods.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/theory/${topic}/methods/${m.slug}`}
                className="flex flex-col gap-1 rounded-2xl bg-muted p-3.5 hover:bg-untouched"
              >
                <span className="font-semibold">
                  <InlineMarkdown source={m.name} />
                </span>
                <span className="text-muted-foreground text-sm">
                  {t.rich("whenShort", {
                    hint: () => <InlineMarkdown source={m.when} />,
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
