"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isActive, sections } from "./sections";

export function NavLinks() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav className="hidden gap-7 md:flex">
      {sections.map(({ href, key }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap font-medium text-subtle transition-colors hover:text-foreground",
              active && "font-semibold text-foreground",
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
