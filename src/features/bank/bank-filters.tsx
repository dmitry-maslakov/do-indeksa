import { useLocale, useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { Card } from "@/components/ui/card";
import { NativeSelectOption } from "@/components/ui/native-select";
import { SignedIn } from "@/features/account/signed-in";
import { positions } from "@/features/exam/exam";
import { topics } from "@/features/tasks/topics";
import { Link } from "@/i18n/navigation";
import { FilterSearch } from "./filter-search";
import { FilterSelect } from "./filter-select";
import { levels, statusFilters } from "./params";

interface BankFiltersProps {
  signedIn?: boolean;
  solveHref: string;
}

export function BankFilters({ signedIn, solveHref }: BankFiltersProps) {
  const t = useTranslations("Bank");
  const solve = useTranslations("Solve");
  const locale = useLocale();

  return (
    <Card size="sm" className="md:sticky md:top-4">
      <LinkTabs
        variant="underline"
        items={[
          { href: "/bank", label: solve("list"), active: true },
          { href: solveHref, label: solve("solve"), active: false },
        ]}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">{t("search")}</span>
          <FilterSearch placeholder={t("search")} />
        </label>
        <label>
          <span className="mb-1 block text-subtle text-xs">{t("number")}</span>
          <FilterSelect name="number" className="w-full">
            <NativeSelectOption value="">{t("any")}</NativeSelectOption>
            {positions.map((p) => (
              <NativeSelectOption key={p.number} value={p.number}>
                {p.number}
              </NativeSelectOption>
            ))}
          </FilterSelect>
        </label>
        <label className="md:order-1">
          <span className="mb-1 block text-subtle text-xs">{t("level")}</span>
          <FilterSelect name="level" className="w-full">
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
          <FilterSelect name="topic" className="w-full">
            <NativeSelectOption value="">{t("allTopics")}</NativeSelectOption>
            {topics.map((topic) => (
              <NativeSelectOption key={topic.id} value={topic.id}>
                {topic.name[locale]}
              </NativeSelectOption>
            ))}
          </FilterSelect>
        </label>
        <SignedIn signedIn={signedIn}>
          <label className="col-span-2 md:order-1 md:col-span-1">
            <span className="mb-1 block text-subtle text-xs">
              {t("status")}
            </span>
            <FilterSelect name="status" className="w-full">
              <NativeSelectOption value="">{t("any")}</NativeSelectOption>
              {statusFilters.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {t("statuses", { status: s })}
                </NativeSelectOption>
              ))}
            </FilterSelect>
          </label>
        </SignedIn>
      </div>
      <Link
        href="/bank"
        className="w-fit text-[13px] text-subtle hover:text-foreground"
      >
        {t("reset")}
      </Link>
    </Card>
  );
}
