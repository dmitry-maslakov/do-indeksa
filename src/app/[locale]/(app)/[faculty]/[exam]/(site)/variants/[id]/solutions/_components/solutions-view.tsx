import type { Variant } from "content-collections";
import type { Locale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink } from "@/components/external-link";
import { PageTitle } from "@/components/page-title";
import { RailContent, RailPanel } from "@/components/rail";
import { SectionLinks } from "@/components/section-links";
import { Button } from "@/components/ui/button";
import { renderTask } from "@/features/catalog/tasks";
import { topicName } from "@/features/catalog/topics";
import { solutionsTitle } from "@/features/variants/variant-title";
import { minutesOf, slotsOf } from "@/features/variants/variants";
import { Link } from "@/i18n/navigation";
import { controlOf, intentOf } from "@/lib/analytics-browser";
import { type Solution, SolutionTask } from "./solution-task";
import { SolutionsReading } from "./solutions-reading";

async function loadSolutions(
  examId: string,
  taskIds: string[],
  locale: Locale,
) {
  const solutions = await Promise.all(
    slotsOf(examId, taskIds).map(async (slot): Promise<Solution[]> => {
      const html = await renderTask(slot.taskId);
      if (!html) return [];
      const { statement, answer, solution } = html;
      const topic = topicName(slot.topic, locale);
      return [{ ...slot, topicName: topic, statement, answer, solution }];
    }),
  );
  return solutions.flat();
}

export async function SolutionsView({
  examId,
  variant,
}: {
  examId: string;
  variant: Variant;
}) {
  const locale = await getLocale();
  const [t, variants, title, solutions] = await Promise.all([
    getTranslations("Solutions"),
    getTranslations("Variants"),
    solutionsTitle(variant, locale),
    loadSolutions(examId, variant.taskIds, locale),
  ]);

  const anchor = (number: number) => `task-${number}`;

  return (
    <div className="flex items-start gap-14">
      <RailPanel label={t("tasks")}>
        <RailContent>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3">
            <SectionLinks
              base={`/variants/${variant.id}/solutions`}
              control="solutions_task_link"
              sections={solutions.map((s) => ({
                id: anchor(s.number),
                title: (
                  <>
                    <span className="w-5 shrink-0 text-subtle tabular-nums">
                      {s.number}
                    </span>{" "}
                    {s.topicName}
                  </>
                ),
              }))}
            />
          </div>
        </RailContent>
      </RailPanel>
      <div className="flex min-w-0 max-w-250 flex-1 flex-col gap-6 pt-1 md:gap-8">
        <header className="flex flex-col gap-3">
          <p className="flex flex-wrap gap-x-1.5 text-[13px] text-muted-foreground md:text-sm">
            <Link href="/variants" className="hover:text-foreground">
              {t("back")}
            </Link>
            {variant.original && (
              <>
                <span aria-hidden="true">·</span>
                <ExternalLink
                  href={variant.original}
                  className="underline underline-offset-3 hover:text-foreground"
                >
                  {variants("original")}
                </ExternalLink>
              </>
            )}
          </p>
          <PageTitle>{title}</PageTitle>
          <p className="text-muted-foreground">
            {variants("format", {
              tasks: solutions.length,
              minutes: minutesOf(examId, variant),
            })}
          </p>
          <Button
            variant="lime"
            className="mt-1 h-10 w-fit rounded-full px-5"
            render={
              <Link
                href={`/variants/${variant.id}`}
                data-intent={intentOf({ via: "solutions" })}
              />
            }
            nativeButton={false}
          >
            {t("solve")}
          </Button>
        </header>
        <nav aria-label={t("tasks")} className="md:hidden">
          <ol className="grid auto-cols-fr grid-flow-col gap-1">
            {solutions.map((s) => (
              <li key={s.taskId}>
                <a
                  href={`#${anchor(s.number)}`}
                  data-control={controlOf({
                    control: "solutions_task_link",
                    value: anchor(s.number),
                  })}
                  aria-label={t("task", { number: s.number })}
                  className="flex h-9 items-center justify-center rounded-[10px] bg-muted font-bold text-sm tabular-nums outline-none hover:bg-untouched focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {s.number}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <SolutionsReading
          variantId={variant.id}
          className="flex flex-col divide-y md:gap-6 md:divide-y-0"
        >
          {solutions.map((s) => (
            <li
              key={s.taskId}
              id={anchor(s.number)}
              className="scroll-mt-4 py-8 first:pt-0 md:py-0"
            >
              <SolutionTask solution={s} />
            </li>
          ))}
        </SolutionsReading>
      </div>
    </div>
  );
}
