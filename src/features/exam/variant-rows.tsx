"use client";

import { useExamHydrated, useExamStore } from "./exam-store";
import { VariantRow, type VariantRowProps } from "./variant-row";

interface VariantRowsProps {
  rows: Omit<VariantRowProps, "run">[];
}

export function VariantRows({ rows }: VariantRowsProps) {
  const hydrated = useExamHydrated();
  const runs = useExamStore((s) => s.runs);

  return (
    <ul className="divide-y divide-subtle/15 py-1.5">
      {rows.map((row) => (
        <VariantRow
          key={row.id}
          {...row}
          run={hydrated ? runs[row.id] : undefined}
        />
      ))}
    </ul>
  );
}
