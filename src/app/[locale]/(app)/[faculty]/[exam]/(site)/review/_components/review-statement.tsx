"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";
import { MathHtml } from "@/components/math-html";

export function Statement({ html }: { html: string }) {
  const t = useTranslations("Review");
  const box = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (el) setLong(el.scrollHeight > el.clientHeight + 1);
  }, []);

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        ref={box}
        className={cn(
          "w-full overflow-hidden",
          !open && "max-h-[8em]",
          !open && long && "mask-b-from-60%",
        )}
      >
        <MathHtml
          html={html}
          className="text-base leading-relaxed md:text-[17px] [&_.katex-display]:overflow-hidden [&_strong]:font-semibold"
        />
      </div>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-sm text-muted-foreground text-sm underline underline-offset-3 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? t("showLess") : t("showAll")}
        </button>
      )}
    </div>
  );
}
