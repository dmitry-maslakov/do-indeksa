import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";

export default function LaunchLayout({
  children,
}: LayoutProps<"/[locale]/launch">) {
  return (
    <div className="relative min-h-dvh bg-daily text-white">
      <header className="absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between px-4 md:h-17 md:px-9">
        <Logo />
        <LocaleSwitcher />
      </header>
      {children}
    </div>
  );
}
