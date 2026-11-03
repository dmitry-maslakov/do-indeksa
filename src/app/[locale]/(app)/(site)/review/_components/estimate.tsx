"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function Estimate() {
  const t = useTranslations("Review");
  const [open, setOpen] = useState(false);

  return (
    <span className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-sm text-sm text-subtle outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <InfoIcon aria-hidden className="size-3.5" />
        {t("estimateLabel")}
      </button>
      {open && (
        <span className="absolute top-full left-0 z-10 mt-2 block w-72 rounded-xl bg-card p-3 text-[13px] text-muted-foreground leading-normal shadow-card">
          {t("estimate")}
        </span>
      )}
    </span>
  );
}
