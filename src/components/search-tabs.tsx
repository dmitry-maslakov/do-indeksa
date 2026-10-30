"use client";

import type { ComponentProps } from "react";
import { LinkTabs } from "./link-tabs";
import { WithSearchParams } from "./with-url";

interface SearchTabsProps
  extends Pick<
    ComponentProps<typeof LinkTabs>,
    "label" | "variant" | "control"
  > {
  param: string;
  items: { value?: string; href: string; label: string }[];
}

export function SearchTabs({
  param,
  items,
  label,
  variant,
  control,
}: SearchTabsProps) {
  return (
    <WithSearchParams>
      {(params) => {
        const current =
          params &&
          (items.find((item) => item.value === params.get(param)) ?? items[0]);
        return (
          <LinkTabs
            label={label}
            variant={variant}
            control={control}
            items={items.map((item) => ({ ...item, active: item === current }))}
          />
        );
      }}
    </WithSearchParams>
  );
}
