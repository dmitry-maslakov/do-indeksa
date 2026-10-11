"use client";

import type { ComponentProps } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { WithSearchParams } from "./with-url";

export function FilterSelect({
  name,
  ...props
}: ComponentProps<typeof NativeSelect> & { name: string }) {
  return (
    <WithSearchParams>
      {(params) => (
        <NativeSelect
          {...props}
          name={name}
          defaultValue={params?.get(name) ?? ""}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      )}
    </WithSearchParams>
  );
}
