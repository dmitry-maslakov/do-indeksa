import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { FocusMode } from "@/components/focus-mode";
import { RailPanel } from "@/components/rail";
import { toneStyle } from "@/features/catalog/topic-look";
import { topicLook, topicName } from "@/features/catalog/topics";
import { getTheory, methodsOf, theories } from "@/features/theory/theory";
import { InlineMarkdown } from "@/features/theory/theory-markdown";
import { TheoryRail } from "./_components/theory-rail";

export default async function TopicLayout({
  params,
  children,
}: LayoutProps<"/[locale]/theory/[topic]">) {
  const { topic } = await params;
  const theory = getTheory(topic);
  if (!theory) notFound();
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Theory"),
  ]);

  return (
    <main
      style={toneStyle(topicLook(topic).tone)}
      className="px-4 pb-12 md:px-10 md:pt-2 md:pb-15"
    >
      <FocusMode mode="read" />
      <div className="flex items-start gap-14">
        <RailPanel label={t("title")}>
          <TheoryRail
            topic={topic}
            topics={theories.map((x) => ({
              id: x.topic,
              name: topicName(x.topic, locale),
            }))}
            sections={theory.sections}
            methods={methodsOf(topic).map((m) => ({
              slug: m.slug,
              name: <InlineMarkdown source={m.name} />,
              when: <InlineMarkdown source={m.when} />,
            }))}
          />
        </RailPanel>
        <div className="min-w-0 max-w-190 flex-1 pt-1">{children}</div>
      </div>
    </main>
  );
}
