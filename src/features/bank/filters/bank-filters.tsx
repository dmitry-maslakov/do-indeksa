import { useLocale, useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import type { NativeSelect } from "@/components/ui/native-select";
import { NativeSelectOption } from "@/components/ui/native-select";
import { sources, statusFilters } from "@/features/bank/params";
import { positions } from "@/features/catalog/exams";
import { levels } from "@/features/catalog/level";
import { topics } from "@/features/catalog/topics";
import { Link } from "@/i18n/navigation";
import { FilterSelect } from "./filter-select";

interface BankFiltersProps {
  variant?: ComponentProps<typeof NativeSelect>["variant"];
  children?: ReactNode;
}

export function BankFilters({ variant, children }: BankFiltersProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();

  return (
    <>
      <FilterSelect name="topic" label={t("topic")} variant={variant}>
        <NativeSelectOption value="">{t("allTopics")}</NativeSelectOption>
        {topics.map((topic) => (
          <NativeSelectOption key={topic.id} value={topic.id}>
            {topic.name[locale]}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      {children}
      <FilterSelect name="number" label={t("number")} variant={variant}>
        <NativeSelectOption value="">{t("any")}</NativeSelectOption>
        {positions.map((p) => (
          <NativeSelectOption key={p.number} value={p.number}>
            {t("position", { number: p.number })}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      <FilterSelect name="source" label={t("source")} variant={variant}>
        <NativeSelectOption value="">{t("allSources")}</NativeSelectOption>
        {sources.map((source) => (
          <NativeSelectOption key={source} value={source}>
            {t("sources", { source })}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      <FilterSelect name="level" label={t("level")} variant={variant}>
        <NativeSelectOption value="">{t("anyLevel")}</NativeSelectOption>
        {levels.map((level) => (
          <NativeSelectOption key={level} value={level}>
            {t("taskLevel", { level })}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      <FilterSelect name="status" label={t("status")} variant={variant}>
        <NativeSelectOption value="">{t("allStatuses")}</NativeSelectOption>
        {statusFilters.map((status) => (
          <NativeSelectOption key={status} value={status}>
            {t("statuses", { status })}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      <Link
        href="/bank"
        className="w-fit text-muted-foreground text-sm underline decoration-1 underline-offset-3 hover:text-foreground"
      >
        {t("reset")}
      </Link>
    </>
  );
}
