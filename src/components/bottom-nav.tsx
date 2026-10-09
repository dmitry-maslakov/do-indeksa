"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isActive, sections } from "./sections";

export function BottomNav() {
  const t = useTranslations("NavTab");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {sections.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[var(--nav-bottom)] flex-1 flex-col items-center justify-center gap-1 text-subtle text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              active && "font-semibold text-data",
            )}
          >
            <Icon className="size-5" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
