import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <TopNav />
      {children}
      <BottomNav />
    </>
  );
}
