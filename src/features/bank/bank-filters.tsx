import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { NativeSelectOption } from "@/components/ui/native-select";
import { SignedIn } from "@/features/account/signed-in";
import { positions } from "@/features/exam/exam";
import { levels } from "@/features/tasks/level";
import { topics } from "@/features/tasks/topics";
import { Link } from "@/i18n/navigation";
import { FilterSelect } from "./filter-select";
import { sources, statusFilters } from "./params";

interface BankFiltersProps {
  signedIn?: boolean;
  children?: ReactNode;
}

export function BankFilters({ signedIn, children }: BankFiltersProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();

  return (
    <>
      <FilterSelect name="topic" label={t("topic")}>
        <NativeSelectOption value="">{t("allTopics")}</NativeSelectOption>
        {topics.map((topic) => (
          <NativeSelectOption key={topic.id} value={topic.id}>
            {topic.name[locale]}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      {children}
      <FilterSelect name="number" label={t("number")}>
        <NativeSelectOption value="">{t("any")}</NativeSelectOption>
        {positions.map((p) => (
          <NativeSelectOption key={p.number} value={p.number}>
            {t("position", { number: p.number })}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      <FilterSelect name="source" label={t("source")}>
        <NativeSelectOption value="">{t("allSources")}</NativeSelectOption>
        {sources.map((source) => (
          <NativeSelectOption key={source} value={source}>
            {t("sources", { source })}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      <FilterSelect name="level" label={t("level")}>
        <NativeSelectOption value="">{t("anyLevel")}</NativeSelectOption>
        {levels.map((level) => (
          <NativeSelectOption key={level} value={level}>
            {t("taskLevel", { level })}
          </NativeSelectOption>
        ))}
      </FilterSelect>
      <SignedIn signedIn={signedIn}>
        <FilterSelect name="status" label={t("status")}>
          <NativeSelectOption value="">{t("allStatuses")}</NativeSelectOption>
          {statusFilters.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {t("statuses", { status })}
            </NativeSelectOption>
          ))}
        </FilterSelect>
      </SignedIn>
      <Link
        href="/bank"
        className="w-fit text-muted-foreground text-sm underline decoration-1 underline-offset-3 hover:text-foreground"
      >
        {t("reset")}
      </Link>
    </>
  );
}
