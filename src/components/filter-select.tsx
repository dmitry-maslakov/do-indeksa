"use client";

import type { ComponentProps } from "react";
import { NativeSelect } from "@/components/ui/native-select";

export function FilterSelect(props: ComponentProps<typeof NativeSelect>) {
  return (
    <NativeSelect
      {...props}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    />
  );
}
