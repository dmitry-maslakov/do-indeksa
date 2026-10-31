"use client";

import { cn } from "cn";
import { type ComponentProps, Suspense, startTransition } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { bankHref, bankParsers } from "@/features/bank/params";
import { useRouter } from "@/i18n/navigation";
import { useBankState } from "./bank-state";
import { FilterLabel } from "./filter-label";
import { useBankFilters } from "./use-bank-filters";

type FilterSelectProps = ComponentProps<typeof NativeSelect> & {
  name: Exclude<keyof typeof bankParsers, "q">;
};

interface LabeledSelectProps extends FilterSelectProps {
  label: string;
}

function UrlSelect({ name, ...props }: FilterSelectProps) {
  const [filters, setFilters] = useBankFilters();
  const [, showTopic] = useBankState().topic;
  const router = useRouter();

  return (
    <NativeSelect
      {...props}
      name={name}
      value={String(filters[name] ?? "")}
      onChange={(e) => {
        const { value } = e.currentTarget;
        if (name === "topic") {
          const topic = bankParsers.topic.parse(value);
          startTransition(() => {
            showTopic(topic);
            router.push(bankHref({ ...filters, topic }));
          });
        } else setFilters({ [name]: bankParsers[name].parse(value) });
      }}
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
