import {
  BookOpenIcon,
  ClipboardListIcon,
  HomeIcon,
  LibraryBigIcon,
} from "lucide-react";

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

export function isActive(
  pathname: string | undefined,
  { href, nested = [] }: { href: string; nested?: readonly string[] },
) {
  if (href === "/") return pathname === "/";
  return [href, ...nested].some(
    (root) => pathname === root || Boolean(pathname?.startsWith(`${root}/`)),
  );
}
