import { allTopics } from "content-collections";
import Form from "next/form";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import {
  levels,
  positions,
  statusFilters,
  type TaskFilters,
} from "@/server/tasks";
import { FilterSelect } from "./filter-select";

export const BANK_FORM = "bank-filters";

interface BankFiltersProps {
  filters: TaskFilters;
  signedIn: boolean;
}

export function BankFilters({ filters, signedIn }: BankFiltersProps) {
  const t = useTranslations("Bank");
  const locale = useLocale();

  return (
    <Card size="sm" className="md:sticky md:top-4">
      <Form
        id={BANK_FORM}
        action=""
        className="grid grid-cols-2 gap-3 md:grid-cols-1"
      >
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">{t("search")}</span>
          <Input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder={t("search")}
          />
        </label>
        <label>
          <span className="mb-1 block text-subtle text-xs">{t("number")}</span>
          <FilterSelect
            name="number"
            defaultValue={filters.number ?? ""}
            className="w-full"
          >
            <NativeSelectOption value="">{t("any")}</NativeSelectOption>
            {positions.map((p) => (
              <NativeSelectOption key={p.number} value={p.number}>
                №{p.number}
              </NativeSelectOption>
            ))}
          </FilterSelect>
        </label>
        <label>
          <span className="mb-1 block text-subtle text-xs">{t("level")}</span>
          <FilterSelect
            name="level"
            defaultValue={filters.level ?? ""}
            className="w-full"
          >
            <NativeSelectOption value="">{t("any")}</NativeSelectOption>
            {levels.map((l) => (
              <NativeSelectOption key={l} value={l}>
                {t("levels", { level: l })}
              </NativeSelectOption>
            ))}
          </FilterSelect>
        </label>
        <label className="col-span-2 md:col-span-1">
          <span className="mb-1 block text-subtle text-xs">{t("topic")}</span>
          <FilterSelect
            name="topic"
            defaultValue={filters.topic ?? ""}
            className="w-full"
          >
            <NativeSelectOption value="">{t("allTopics")}</NativeSelectOption>
            {allTopics.map((topic) => (
              <NativeSelectOption key={topic.id} value={topic.id}>
                {topic.name[locale]}
              </NativeSelectOption>
            ))}
          </FilterSelect>
        </label>
        {signedIn && (
          <label className="col-span-2 md:col-span-1">
            <span className="mb-1 block text-subtle text-xs">
              {t("status")}
            </span>
            <FilterSelect
              name="status"
              defaultValue={filters.status ?? ""}
              className="w-full"
            >
              <NativeSelectOption value="">{t("any")}</NativeSelectOption>
              {statusFilters.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {t("statuses", { status: s })}
                </NativeSelectOption>
              ))}
            </FilterSelect>
          </label>
        )}
      </Form>
      <Link
        href="/bank"
        className="w-fit text-[13px] text-subtle hover:text-foreground"
      >
        {t("reset")}
      </Link>
    </Card>
  );
}
