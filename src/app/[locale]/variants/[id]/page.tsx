import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
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

  return (
    <main className="px-4 pb-9 md:px-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2 py-6">
        <h1 className="font-bold text-3xl">{await variantTitle(variant)}</h1>
        <span className="text-sm text-subtle">
          {t("format", { tasks: tasks.length, minutes })}
        </span>
      </div>
      <ExamRunner variantId={variant.id} tasks={tasks} minutes={minutes} />
    </main>
  );
}
