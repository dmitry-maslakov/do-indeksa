"use client";

import type { ComponentProps } from "react";
import { useListHref } from "@/features/bank/last-list";
import { Link } from "@/i18n/navigation";

export function SectionLink({ href, ...props }: ComponentProps<typeof Link>) {
  const list = useListHref(String(href));
  return <Link href={href === "/bank" ? list : href} {...props} />;
}
