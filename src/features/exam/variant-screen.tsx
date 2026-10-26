import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { PageTitle } from "@/components/page-title";
import { getProfileId } from "@/server/auth";
import type { ComposeMode } from "./compose";
import { swapHrefs } from "./compose-set";
import { ExamGhost } from "./exam-ghost";
import { ExamRunner } from "./exam-runner";
import { getUnfinishedTest } from "./test-sessions";
import { variantTitle } from "./variant-title";
import { type ExamVariant, minutesOf, tasksFor } from "./variants";

export async function variantMetadata(variant: ExamVariant): Promise<Metadata> {
  const t = await getTranslations("Variants");
  return {
    title: await variantTitle(variant, await getLocale()),
    description: t("format", {
      tasks: variant.taskIds.length,
      minutes: minutesOf(variant),
    }),
  };
}

export async function VariantScreen({
  variant,
  code,
  fallback,
}: {
  variant: ExamVariant;
  code?: string;
  fallback?: ComposeMode;
}) {
  const t = await getTranslations("Variants");
  const locale = await getLocale();
  const tasks = await tasksFor(variant.taskIds, locale);
  const minutes = minutesOf(variant);
  const title = await variantTitle(variant, locale);

  return (
    <main className="px-4 pb-28 md:px-10 md:pt-2 md:pb-15">
      <div className="flex flex-wrap items-baseline justify-between gap-2 py-6 exam-running:sr-only">
        <PageTitle className="p-0">{title}</PageTitle>
        <span className="text-sm text-subtle">
          {t("format", { tasks: tasks.length, minutes })}
          {code && ` · ${t("code", { code })}`}
          {variant.original && (
            <>
              {" · "}
              <a
                href={variant.original}
                target="_blank"
                rel="noopener"
                className="underline underline-offset-3 hover:text-foreground"
              >
                {t("original")}
              </a>
            </>
          )}
        </span>
      </div>
      <Suspense fallback={<ExamGhost />}>
        <Await
          promise={getProfileId().then((id) =>
            getUnfinishedTest(id, variant.id),
          )}
        >
          {(saved) => (
            <ExamRunner
              variantId={variant.id}
              tasks={tasks}
              minutes={minutes}
              title={title}
              saved={saved}
              fallback={fallback}
              swaps={
                variant.kind === "custom"
                  ? swapHrefs(variant.taskIds)
                  : undefined
              }
            />
          )}
        </Await>
      </Suspense>
    </main>
  );
}
