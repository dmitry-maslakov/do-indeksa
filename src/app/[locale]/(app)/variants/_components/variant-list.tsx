import type { Variant } from "content-collections";
import { Card } from "@/components/ui/card";
import type { RunSummary } from "@/features/exam/run-summaries";
import { VariantRows } from "@/features/exam/variant-rows";

export function VariantList({
  variants,
  runs,
}: {
  variants: Variant[];
  runs?: RunSummary[];
}) {
  return (
    <Card className="p-0 md:p-0">
      <VariantRows
        rows={variants.map((v) => ({
          id: v.id,
          title: v.title,
          tasks: v.taskIds.length,
          latest: runs?.find((r) => r.variantId === v.id),
          pending: !runs,
        }))}
      />
    </Card>
  );
}
