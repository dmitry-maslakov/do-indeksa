"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { WithPathname } from "@/components/with-url";
import { Link } from "@/i18n/navigation";
import { isActive, useSectionLinks } from "./sections";

export function NavLinks() {
  const t = useTranslations("Nav");
  const links = useSectionLinks();

  return (
    <nav aria-label={t("label")} className="hidden gap-6 lg:flex">
      <WithPathname>
        {(pathname) =>
          links.map((section) => {
            const { link, key } = section;
            const active = isActive(pathname, section);
            return (
              <Link
                key={key}
                href={link}
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
