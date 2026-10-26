import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import type { Suggestion } from "@/features/progress/topic-progress";
import { topicName } from "@/features/tasks/topics";
import { HeroBackdrop } from "./hero-backdrop";
import { SuggestionLink } from "./suggestion-link";

export function TodayHero({ topic, reason }: Suggestion) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <section className="relative pt-5 pb-7 md:pt-7 md:pb-10">
      <HeroBackdrop />
      <Image
        src="/hero.webp"
        width={760}
        height={605}
        alt=""
        className="pointer-events-none absolute -top-4 -right-2 h-75 w-auto max-xl:hidden"
      />
      <div className="relative xl:max-w-3xl">
        <h1 className="text-balance font-bold text-3xl leading-none tracking-tight md:text-display md:leading-none">
          {topicName(topic, locale)}
        </h1>
        <p className="mt-3 mb-5 max-w-140 text-muted-foreground md:mt-4 md:mb-7 md:text-lg">
          {t.rich("suggestion", {
            reason: t(`reason.${reason}`),
            b: (chunks) => (
              <span className="font-semibold text-foreground">{chunks}</span>
            ),
          })}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SuggestionLink
            topic={topic}
            reason={reason}
            className={buttonVariants({
              variant: "lime",
              className: "h-12 rounded-xl px-6 font-semibold text-base",
            })}
          >
            {reason === "first" || reason === "next"
              ? t("startTopic")
              : t("continueTopic")}
          </SuggestionLink>
          <a
            href="#topic-map"
            className="text-base text-muted-foreground hover:text-foreground"
          >
            {t("otherTopic")}
          </a>
        </div>
      </div>
    </section>
  );
}
