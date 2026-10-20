"use client";

import { cn } from "cn";
import { type ComponentProps, Suspense } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { FilterLabel } from "./filter-label";
import { bankParsers } from "./params";
import { useBankFilters } from "./use-bank-filters";

type FilterSelectProps = ComponentProps<typeof NativeSelect> & {
  name: Exclude<keyof typeof bankParsers, "q">;
};

interface LabeledSelectProps extends FilterSelectProps {
  label: string;
}

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

export function FilterSelect({
  label,
  className,
  ...props
}: LabeledSelectProps) {
  const styled = {
    ...props,
    "aria-label": label,
    size: "md" as const,
    className: cn("w-full", className),
  };
  return (
    <FilterLabel text={label}>
      <Suspense fallback={<NativeSelect {...styled} />}>
        <UrlSelect {...styled} />
      </Suspense>
    </FilterLabel>
  );
}
