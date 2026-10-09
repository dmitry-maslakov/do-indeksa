import {
  ChartColumnIcon,
  ClipboardListIcon,
  HomeIcon,
  LibraryBigIcon,
} from "lucide-react";

export const sections = [
  { href: "/", key: "home", icon: HomeIcon },
  { href: "/bank", key: "bank", icon: LibraryBigIcon },
  { href: "/variants", key: "variants", icon: ClipboardListIcon },
  { href: "/stats", key: "stats", icon: ChartColumnIcon },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
