"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const sections = [
  { href: "/", key: "home" },
  { href: "/bank", key: "bank" },
  { href: "/variants", key: "variants" },
  { href: "/stats", key: "stats" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav className="order-last -mx-4 flex w-full gap-7 overflow-x-auto px-4 pb-3 md:order-none md:mx-0 md:w-auto md:overflow-visible md:p-0">
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
