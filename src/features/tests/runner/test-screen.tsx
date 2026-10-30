import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { getUnfinishedTest } from "@/features/tests/test-sessions";
import type { ComposeMode } from "@/features/variants/custom/compose";
import { swapIds } from "@/features/variants/custom/compose-set";
import { variantTitle } from "@/features/variants/variant-title";
import {
  type ExamVariant,
  minutesOf,
  tasksFor,
} from "@/features/variants/variants";
import { getProfileId } from "@/server/profile";
import { TestGhost } from "./test-ghost";
import { TestRunner } from "./test-runner";

export async function TestScreen({
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
      <Suspense fallback={<TestGhost />}>
        <Await
          promise={getProfileId().then((id) =>
            getUnfinishedTest(id, variant.id),
          )}
        >
          {(saved) => (
            <TestRunner
              key={variant.id}
              variantId={variant.id}
              kind={variant.kind}
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
