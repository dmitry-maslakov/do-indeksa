import { Suspense } from "react";
import { BottomNav } from "@/app/[locale]/(app)/_components/shell/bottom-nav";
import { Footer } from "@/app/[locale]/(app)/_components/shell/footer";
import { QueryProvider } from "@/app/[locale]/(app)/_components/shell/query-provider";
import { TopNav } from "@/app/[locale]/(app)/_components/shell/top-nav";
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
