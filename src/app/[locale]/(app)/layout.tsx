import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Footer } from "@/components/footer";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Toaster } from "@/components/ui/sonner";
import { AdoptGuest } from "@/features/account/adopt-guest";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <QueryProvider>
      <TopNav />
      {children}
      <Footer />
      <BottomNav />
      <Toaster position="top-center" />
      <Suspense>
        <AdoptGuest />
      </Suspense>
    </QueryProvider>
  );
}
