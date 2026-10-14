"use client";

import { type ComponentProps, Suspense } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { bankParsers } from "@/lib/bank-params";
import { useBankFilters } from "@/lib/use-bank-filters";

type FilterSelectProps = ComponentProps<typeof NativeSelect> & {
  name: Exclude<keyof typeof bankParsers, "q">;
};

function UrlSelect({ name, ...props }: FilterSelectProps) {
  const [filters, setFilters] = useBankFilters();

  return (
    <NativeSelect
      {...props}
      name={name}
      value={String(filters[name] ?? "")}
      onChange={(e) =>
        setFilters({ [name]: bankParsers[name].parse(e.currentTarget.value) })
      }
    />
  );
}

export function FilterSelect(props: FilterSelectProps) {
  return (
    <Suspense fallback={<NativeSelect {...props} />}>
      <UrlSelect {...props} />
    </Suspense>
  );
}
