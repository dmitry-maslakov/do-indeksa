import {
  BookOpenIcon,
  ClipboardListIcon,
  HomeIcon,
  LibraryBigIcon,
} from "lucide-react";
import { useListHref } from "@/features/bank/last-list";

export const sections = [
  { href: "/", key: "home", icon: HomeIcon },
  { href: "/bank", key: "bank", icon: LibraryBigIcon },
  {
    href: "/variants",
    key: "variants",
    icon: ClipboardListIcon,
    nested: ["/review", "/v"],
  },
  { href: "/theory", key: "theory", icon: BookOpenIcon },
] as const;

export function useSectionLinks() {
  const bank = useListHref("/bank");
  return sections.map((section) => ({
    ...section,
    link: section.href === "/bank" ? bank : section.href,
  }));
}

export function isActive(
  pathname: string | undefined,
  { href, nested = [] }: { href: string; nested?: readonly string[] },
) {
  if (href === "/") return pathname === "/";
  return [href, ...nested].some(
    (root) => pathname === root || Boolean(pathname?.startsWith(`${root}/`)),
  );
}
