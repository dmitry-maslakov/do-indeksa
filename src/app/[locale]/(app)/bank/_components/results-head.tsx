import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

interface ResultsHeadProps {
  count: number;
  label: string;
  pending?: boolean;
}

export function ResultsHead({ count, label, pending }: ResultsHeadProps) {
  const t = useTranslations("Bank");
  return (
    <div className="flex items-center justify-between gap-3 px-1 lg:px-0">
      {pending ? (
        <Skeleton className="my-1 h-4 w-24" />
      ) : (
        <span className="shrink-0 font-semibold text-base lg:font-normal lg:text-base">
          {t("count", { count })}
        </span>
      )}
      <span className="truncate text-sm text-subtle lg:hidden">{label}</span>
    </div>
  );
}
