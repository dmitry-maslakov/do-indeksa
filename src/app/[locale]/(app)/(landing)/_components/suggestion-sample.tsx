import { useLocale, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { topicName } from "@/features/catalog/topics";
import { stuckTopic } from "./topic-map-sample";

export function SuggestionSample({ sample }: { sample: string }) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const topic = stuckTopic(sample);
  if (!topic) return null;

  return (
    <article className="absolute top-76 right-0 flex w-81 flex-col rounded-3xl border border-input bg-card px-4.5 pt-4.5 pb-5 lg:top-86 lg:right-auto lg:left-44 lg:w-100 lg:p-6">
      <span className="font-bold text-[26px] leading-none tracking-tight lg:text-[34px]">
        {topicName(topic, locale)}
      </span>
      <p className="mt-2.5 text-muted-foreground text-sm leading-normal lg:mt-3.5 lg:text-base">
        {t.rich("suggestion", {
          reason: t("reason.stuck"),
          b: (chunks) => (
            <b className="font-semibold text-foreground">{chunks}</b>
          ),
        })}
      </p>
      <span
        className={buttonVariants({
          variant: "lime",
          className:
            "mt-4 h-11 self-start rounded-xl px-5 text-[15px] leading-5 lg:mt-5 lg:h-12 lg:px-6 lg:text-base",
        })}
      >
        {t("continueTopic")}
      </span>
    </article>
  );
}
