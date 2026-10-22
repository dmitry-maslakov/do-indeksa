import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import type { Suggestion } from "@/features/progress/topic-progress";
import { TopicIcon } from "@/features/tasks/topic-icon";
import { topicLook, topicName } from "@/features/tasks/topics";
import { Link } from "@/i18n/navigation";
import { HeroBackdrop } from "./hero-backdrop";

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
      <div className="relative flex gap-6">
        <div className="mt-2 max-md:hidden">
          <TopicIcon {...topicLook(topic)} size="lg" />
        </div>
        <div className="xl:max-w-3xl">
          <p className="mb-1 font-semibold text-muted-foreground text-sm">
            {t("suggestion")}
          </p>
          <h1 className="text-balance font-bold text-3xl leading-none tracking-tight md:text-display md:leading-none">
            {topicName(topic, locale)}
          </h1>
          <p className="mt-2 mb-4 max-w-140 text-sm md:mt-3 md:mb-6 md:text-lg">
            {t(`reason.${reason}`)}
          </p>
          <div className="flex flex-wrap items-center gap-5 md:flex-nowrap">
            <Link
              href={`/bank/start/${topic}`}
              prefetch={false}
              className={buttonVariants({
                variant: "lime",
                className: "h-12 rounded-xl px-6 text-base",
              })}
            >
              {reason === "first" || reason === "next"
                ? t("startTopic")
                : t("continueTopic")}
            </Link>
            <a
              href="#topic-map"
              className="text-base text-muted-foreground underline underline-offset-3"
            >
              {t("otherTopic")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
