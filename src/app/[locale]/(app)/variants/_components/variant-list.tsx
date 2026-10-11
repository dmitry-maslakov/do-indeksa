import type { Variant } from "content-collections";
import { Card } from "@/components/ui/card";
import { VariantRow } from "@/components/variant-row";
import type { RunSummary } from "@/content/runs";

export function VariantList({
  variants,
  runs,
}: {
  variants: Variant[];
  runs?: RunSummary[];
}) {
  return (
    <Card className="p-0 md:p-0">
      <ul className="divide-y divide-subtle/15 py-1.5">
        {variants.map((v) => (
          <VariantRow
            key={v.id}
            id={v.id}
            title={v.title}
            tasks={v.taskIds.length}
            latest={runs?.find((r) => r.variantId === v.id)}
            pending={!runs}
          />
        ))}
      </ul>
    </Card>
  );
}
