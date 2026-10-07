import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { NavLinks } from "./nav-links";

export function TopNav() {
  return (
    <header className="flex flex-wrap items-center gap-x-7 px-4 md:h-17 md:flex-nowrap md:px-9">
      <Link
        href="/"
        className="flex h-14 items-center font-bold text-lg tracking-tight md:h-auto"
      >
        do indeksa
      </Link>
      <NavLinks />
      <LocaleSwitcher />
    </header>
  );
}
