import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { BANK_FORM, BankFilters } from "@/components/bank-filters";
import { FilterSelect } from "@/components/filter-select";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import { findTasks, levels } from "@/server/tasks";

const optional = <T extends z.ZodType>(schema: T) =>
  schema.optional().catch(undefined);

const searchParamsSchema = z.object({
  q: optional(z.string().trim().min(1).max(100)),
  number: optional(z.coerce.number().int().positive()),
  topic: optional(z.string().min(1)),
  level: optional(z.enum(levels)),
  sort: optional(z.enum(["easy", "hard"])),
});

export default async function BankPage({
  searchParams,
}: PageProps<"/[locale]/bank">) {
  const filters = searchParamsSchema.parse(await searchParams);
  const tasks = findTasks(filters);
  const t = await getTranslations("Bank");

  return (
    <main className="px-4 pb-9 md:px-9">
      <h1 className="py-6 font-bold text-3xl">{t("title")}</h1>
      <div className="grid items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <BankFilters filters={filters} />
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4 px-1 text-sm">
            <span className="font-semibold">
              {t("count", { count: tasks.length })}
            </span>
            <FilterSelect
              form={BANK_FORM}
              name="sort"
              defaultValue={filters.sort ?? ""}
              size="sm"
              aria-label={t("sort")}
            >
              <NativeSelectOption value="">
                {t("sortNumber")}
              </NativeSelectOption>
              <NativeSelectOption value="easy">
                {t("sortEasy")}
              </NativeSelectOption>
              <NativeSelectOption value="hard">
                {t("sortHard")}
              </NativeSelectOption>
            </FilterSelect>
          </div>
          {tasks.length === 0 ? (
            <Card className="items-center text-center">
              <p className="font-semibold">{t("empty")}</p>
              <p className="text-muted-foreground text-sm">{t("emptyHint")}</p>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/bank" />}
                nativeButton={false}
              >
                {t("showAll")}
              </Button>
            </Card>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </section>
      </div>
    </main>
  );
}
