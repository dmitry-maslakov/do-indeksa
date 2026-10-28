import { Suspense } from "react";
import { QueryProvider } from "@/app/[locale]/(app)/_components/shell/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { AdoptGuest } from "@/features/account/adopt-guest";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <QueryProvider>
      {children}
      <Toaster position="top-center" />
      <Suspense>
        <AdoptGuest />
      </Suspense>
    </QueryProvider>
  );
}
