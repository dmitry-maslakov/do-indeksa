"use client";

import { cn } from "cn";
import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";
import { type ComponentProps, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { useBankFilters } from "./use-bank-filters";

type FilterSearchProps = Omit<
  ComponentProps<typeof Input>,
  "name" | "type" | "value" | "defaultValue" | "onChange"
> & { variant?: "muted" | "card" };

const field =
  "h-10 pl-10 font-medium placeholder:font-normal [&::-webkit-search-cancel-button]:hidden";

function UrlSearch({ variant, ...props }: FilterSearchProps) {
  const [{ q }, setFilters] = useBankFilters();

  return (
    <Input
      {...props}
      type="search"
      name="q"
      value={q ?? ""}
      enterKeyHint="search"
      className={cn(field, variant === "card" && "bg-card")}
      onChange={(e) =>
        setFilters(
          { q: e.currentTarget.value || null },
          { limitUrlUpdates: debounce(300) },
        )
      }
    />
  );
}

export function FilterSearch({
  className,
  variant,
  ...props
}: FilterSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-3 z-10 size-4 text-subtle"
      />
      <Suspense
        fallback={
          <Input
            {...props}
            type="search"
            name="q"
            className={cn(field, variant === "card" && "bg-card")}
          />
        }
      >
        <UrlSearch {...props} variant={variant} />
      </Suspense>
    </div>
  );
}
