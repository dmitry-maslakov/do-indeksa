import type { Variant } from "content-collections";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Segment } from "@/lib/strip";
import { VariantStrip } from "./variant-strip";

interface VariantRowProps {
  variant: Variant;
  segments: Segment[];
}

export function VariantRow({ variant, segments }: VariantRowProps) {
  const t = useTranslations("Variants");
  const title = variant.title ?? String(variant.year);

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 px-5 py-4 text-sm md:grid-cols-[110px_minmax(0,1fr)_auto] md:px-6">
      <span className="font-semibold">{title}</span>
      <VariantStrip
        segments={segments}
        label={t("strip", { count: segments.length })}
        className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto"
      />
      <Button
        size="sm"
        variant="tint"
        render={<Link href={`/variants/${variant.id}`} />}
        nativeButton={false}
      >
        {t("start")}
      </Button>
    </li>
  );
}
