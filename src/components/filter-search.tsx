"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { WithSearchParams } from "./with-url";

export function FilterSearch({
  name,
  ...props
}: ComponentProps<typeof Input> & { name: string }) {
  return (
    <WithSearchParams>
      {(params) => (
        <Input
          {...props}
          type="search"
          name={name}
          defaultValue={params?.get(name) ?? ""}
        />
      )}
    </WithSearchParams>
  );
}
