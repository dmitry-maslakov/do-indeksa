import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import {
  type ExamVariant,
  examTasks,
  getVariant,
  minutesOf,
} from "@/content/variants";
import { ExamRunner } from "./_components/exam-runner";

export default async function VariantPage({
  params,
}: PageProps<"/[locale]/variants/[id]">) {
  const { id } = await params;
  const variant = getVariant(id);
  if (!variant) notFound();

  const t = await getTranslations("Variants");
  const tasks = examTasks(variant, await getLocale());
  const minutes = minutesOf(variant);

  return (
    <main className="px-4 pb-9 md:px-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2 py-6">
        <h1 className="font-bold text-3xl">{await titleOf(variant)}</h1>
        <span className="text-sm text-subtle">
          {t("format", { tasks: tasks.length, minutes })}
        </span>
      </div>
      <ExamRunner variantId={variant.id} tasks={tasks} minutes={minutes} />
    </main>
  );
}

async function titleOf(variant: ExamVariant) {
  const t = await getTranslations("Variants");
  if (variant.kind === "daily") {
    const format = await getFormatter();
    const date = new Date(`${variant.id.slice(6)}T12:00:00Z`);
    return t("dailyOn", {
      date: format.dateTime(date, { day: "numeric", month: "long" }),
    });
  }
  if (variant.kind === "random") return t("random");
  return variant.title ?? String(variant.year);
}
