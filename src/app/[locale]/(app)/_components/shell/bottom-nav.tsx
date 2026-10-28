"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { WithPathname } from "@/components/with-url";
import { Link } from "@/i18n/navigation";
import { isActive, sections } from "./sections";

export function BottomNav({ className }: { className?: string }) {
  const t = useTranslations("Nav");

  return (
    <nav
      aria-label={t("label")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex border-t bg-card pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] lg:hidden",
        className,
      )}
    >
      <WithPathname>
        {(pathname) =>
          sections.map((section) => {
            const { href, key, icon: Icon } = section;
            const active = isActive(pathname, section);
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-(--nav-bottom) flex-1 flex-col items-center justify-center gap-1 text-xs text-subtle outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  active && "font-semibold text-foreground",
                )}
              >
                <Icon className="size-6" />
                {t(key)}
              </Link>
            );
          })
        }
      </WithPathname>
    </nav>
  );
}
