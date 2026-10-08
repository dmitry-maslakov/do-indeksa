import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/page-title";
import { swapHrefs } from "@/content/compose";
import { variantTitle } from "@/content/variant-title";
import { getVariant, minutesOf, tasksFor } from "@/content/variants";
import { ExamRunner } from "./_components/exam-runner";

export default async function VariantPage({
  params,
}: PageProps<"/[locale]/variants/[id]">) {
  const { id } = await params;
  const variant = getVariant(id);
  if (!variant) notFound();

  const t = await getTranslations("Variants");
  const tasks = tasksFor(variant.taskIds, await getLocale());
  const minutes = minutesOf(variant);
  const title = await variantTitle(variant);

  return (
    <main className="px-4 pb-9 md:px-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2 py-6">
        <PageTitle className="p-0">{title}</PageTitle>
        <span className="text-sm text-subtle">
          {t("format", { tasks: tasks.length, minutes })}
        </span>
      </div>
      <ExamRunner
        variantId={variant.id}
        tasks={tasks}
        minutes={minutes}
        title={title}
        swaps={
          variant.kind === "custom" ? swapHrefs(variant.taskIds) : undefined
        }
      />
    </main>
  );
}
