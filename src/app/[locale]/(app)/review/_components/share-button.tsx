"use client";

import { CheckIcon, Share2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import { secondMs } from "@/lib/dates";

interface ShareButtonProps {
  title: string;
  href: string;
  className?: string;
}

export function ShareButton({ title, href, className }: ShareButtonProps) {
  const t = useTranslations("Share");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = {
      title,
      url: location.origin + getPathname({ href, locale }),
    };
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.(data)) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    const written = await navigator.clipboard
      .writeText(data.url)
      .then(() => true)
      .catch(() => false);
    if (!written) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2 * secondMs);
  }

  return (
    <Button variant="ghost" className={className} onClick={share}>
      {copied ? <CheckIcon /> : <Share2Icon />}
      {copied ? t("copied") : t("share")}
    </Button>
  );
}
