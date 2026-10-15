import { BottomNav } from "@/components/bottom-nav";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <QueryProvider>
      <TopNav />
      {children}
      <BottomNav />
      <Toaster position="top-center" />
    </QueryProvider>
  );
}
