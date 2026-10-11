import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";

export default function LaunchLayout({
  children,
}: LayoutProps<"/[locale]/launch">) {
  return (
    <>
      <header className="flex h-14 items-center justify-between px-4 md:h-17 md:px-9">
        <Logo />
        <LocaleSwitcher />
      </header>
      {children}
    </>
  );
}
