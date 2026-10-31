import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { topicName } from "@/features/catalog/topics";
import { HeroBackdrop } from "./hero-backdrop";
import type { HomeData } from "./personal";
import { SuggestionLink } from "./suggestion-link";
import { TopicMapLink } from "./topic-map";

type Hero = NonNullable<HomeData["hero"]>;

function Headline({ topic, reason }: Hero) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <>
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
    </>
  );
}

function HeadlineSkeleton() {
  return (
    <>
      <Skeleton className="h-7.5 w-72 max-w-full md:h-12 md:w-120" />
      <div className="mt-3 mb-5 flex h-6 items-center md:mt-4 md:mb-7 md:h-7">
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
    </>
  );
}

function Start({ topic, reason, href, recommendation }: Hero) {
  const t = useTranslations("Home");

  return (
    <SuggestionLink
      topic={topic}
      reason={reason}
      href={href}
      recommendation={recommendation}
      className={buttonVariants({
        variant: "lime",
        className: "h-12 rounded-xl px-6 font-semibold text-base",
      })}
    >
      {reason === "first" || reason === "next"
        ? t("startTopic")
        : t("continueTopic")}
    </SuggestionLink>
  );
}

export function TodayHero({
  suggestion,
}: {
  suggestion: Promise<Hero | undefined>;
}) {
  const t = useTranslations("Home");

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
        <Suspense fallback={<HeadlineSkeleton />}>
          <Await promise={suggestion}>
            {(hero) => hero && <Headline {...hero} />}
          </Await>
        </Suspense>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Suspense fallback={<Skeleton className="h-12 w-32 rounded-xl" />}>
            <Await promise={suggestion}>
              {(hero) => hero && <Start {...hero} />}
            </Await>
          </Suspense>
          <TopicMapLink className="text-base text-muted-foreground hover:text-foreground">
            {t("otherTopic")}
          </TopicMapLink>
        </div>
      </div>
    </section>
  );
}
