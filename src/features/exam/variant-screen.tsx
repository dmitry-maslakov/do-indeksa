import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import { PageTitle } from "@/components/page-title";
import { getSession } from "@/server/auth";
import type { ComposeMode } from "./compose";
import { swapHrefs } from "./compose-set";
import { getCurrentRun } from "./current-run";
import { ExamGhost } from "./exam-ghost";
import { ExamRunner } from "./exam-runner";
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

async function loadAccount() {
  const session = await getSession();
  return {
    signedIn: Boolean(session),
    account: session ? await getCurrentRun(session.user.id) : undefined,
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
    <main className="px-4 pb-9 md:px-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2 py-6">
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
        <Await promise={loadAccount()}>
          {({ signedIn, account }) => (
            <ExamRunner
              variantId={variant.id}
              tasks={tasks}
              minutes={minutes}
              title={title}
              signedIn={signedIn}
              account={account}
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
