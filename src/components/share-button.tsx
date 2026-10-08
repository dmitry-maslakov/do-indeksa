"use client";

import { CheckIcon, Share2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const t = useTranslations("Share");
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = { title, url: location.href };
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.(data)) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" className="w-full" onClick={share}>
      {copied ? <CheckIcon /> : <Share2Icon />}
      {copied ? t("copied") : t("share")}
    </Button>
  );
}
