"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isActive, sections } from "./sections";
import { WithPathname } from "./with-url";

export function NavLinks() {
  const t = useTranslations("Nav");

  return (
    <nav aria-label={t("label")} className="hidden gap-6 lg:flex">
      <WithPathname>
        {(pathname) =>
          sections.map(({ href, key }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap text-base text-subtle transition-colors hover:text-foreground",
                  active && "font-semibold text-foreground",
                )}
              >
                {t(key)}
              </Link>
            );
          })
        }
      </WithPathname>
    </nav>
  );
}
