"use client";

import { CheckIcon, Share2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import { queueEvent, shareSource } from "@/lib/analytics-browser";
import { secondMs } from "@/lib/dates";

const shareTags = { utm_source: shareSource, utm_medium: "variant" };

interface ShareButtonProps {
  title: string;
  variantId: string;
  className?: string;
}

export function ShareButton({ title, variantId, className }: ShareButtonProps) {
  const t = useTranslations("Share");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = {
      title,
      url:
        location.origin +
        getPathname({
          href: { pathname: `/variants/${variantId}`, query: shareTags },
          locale,
        }),
    };
    const native =
      matchMedia("(pointer: coarse)").matches && navigator.canShare?.(data);
    const sent = native
      ? navigator.share(data)
      : navigator.clipboard.writeText(data.url);
    const ok = await sent.then(
      () => true,
      () => false,
    );
    queueEvent("result_shared", {
      variant_id: variantId,
      method: native ? "native" : "clipboard",
      ok,
    });
    if (native || !ok) return;
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
