import {
  BookOpenIcon,
  ClipboardListIcon,
  HomeIcon,
  LibraryBigIcon,
} from "lucide-react";

export const sections = [
  { href: "/", key: "home", icon: HomeIcon },
  { href: "/bank", key: "bank", icon: LibraryBigIcon },
  { href: "/variants", key: "variants", icon: ClipboardListIcon },
  { href: "/theory", key: "theory", icon: BookOpenIcon },
] as const;

export function isActive(pathname: string | undefined, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}
