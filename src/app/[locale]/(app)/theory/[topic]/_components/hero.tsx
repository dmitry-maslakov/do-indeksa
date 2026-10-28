import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { numberOf } from "@/features/catalog/exams";
import { topicName } from "@/features/catalog/topics";
import { getTheory, methodsOf } from "@/features/theory/theory";

export function Hero({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-3xl bg-(--tint) p-4.5 md:gap-2 md:p-6.5">
      <h1 className="font-bold text-[22px] leading-[1.15] md:text-3xl">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm md:text-[15px]">{children}</p>
    </div>
  );
}

export function TopicHero({ topic }: { topic: string }) {
  const t = useTranslations("Theory");
  const locale = useLocale();
  const number = numberOf(topic);
  const counts = t("counts", {
    sections: getTheory(topic)?.sections.length ?? 0,
    methods: methodsOf(topic).length,
  });

  return (
    <Hero title={topicName(topic, locale)}>
      {number ? `${t("position", { number })} · ${counts}` : counts}
    </Hero>
  );
}
