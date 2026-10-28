import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { getProfileId } from "@/server/profile";
import type { ComposeMode } from "./compose";
import { swapIds } from "./compose-set";
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
  const locale = await getLocale();
  const tasks = await tasksFor(variant.taskIds, locale);
  const minutes = minutesOf(variant);
  const title = await variantTitle(variant, locale);

  return (
    <main className="px-4 pb-28 md:px-10 md:pt-2 md:pb-15">
      <h1 className="sr-only">{title}</h1>
      <Suspense fallback={<ExamGhost />}>
        <Await
          promise={getProfileId().then((id) =>
            getUnfinishedTest(id, variant.id),
          )}
        >
          {(saved) => (
            <ExamRunner
              key={variant.id}
              variantId={variant.id}
              tasks={tasks}
              minutes={minutes}
              title={title}
              code={code}
              saved={saved}
              fallback={fallback}
              swaps={
                variant.kind === "custom" ? swapIds(variant.taskIds) : undefined
              }
            />
          )}
        </Await>
      </Suspense>
    </main>
  );
}
