"use client";

import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type TransitionStartFunction, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const names = useTranslations("Locale");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className="bg-card px-2.5 shadow-raised sm:px-4"
          />
        }
        aria-label={t("label")}
      >
        <LanguagesIcon />
        <span className="hidden sm:inline">{names(locale)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <LocaleOptions startTransition={startTransition} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LocaleOptions({
  startTransition,
}: {
  startTransition: TransitionStartFunction;
}) {
  const names = useTranslations("Locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function select(next: string) {
    const target = routing.locales.find((l) => l === next);
    if (target)
      startTransition(() =>
        router.replace(`${pathname}${location.search}`, { locale: target }),
      );
  }

  return (
    <DropdownMenuRadioGroup value={locale} onValueChange={select}>
      {routing.locales.map((l) => (
        <DropdownMenuRadioItem key={l} value={l}>
          {names(l)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
