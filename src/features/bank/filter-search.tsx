"use client";

import { type ComponentProps, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { bankParsers } from "./params";
import { useBankFilters } from "./use-bank-filters";

type FilterSearchProps = Omit<ComponentProps<typeof Input>, "name" | "type">;

function UrlSearch(props: FilterSearchProps) {
  const [{ q }, setFilters] = useBankFilters();

  return (
    <Input
      {...props}
      key={q}
      type="search"
      name="q"
      defaultValue={q ?? ""}
      enterKeyHint="search"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing)
          setFilters({ q: bankParsers.q.parse(e.currentTarget.value) });
      }}
    />
  );
}

export function FilterSearch(props: FilterSearchProps) {
  return (
    <Suspense fallback={<Input {...props} type="search" name="q" />}>
      <UrlSearch {...props} />
    </Suspense>
  );
}
