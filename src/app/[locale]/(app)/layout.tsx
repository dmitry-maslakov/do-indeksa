import { QueryProvider } from "@/app/[locale]/(app)/_components/shell/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { GuestAdoption } from "@/features/account/guest-adoption";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <QueryProvider>
      {children}
      <Toaster position="top-center" />
      <GuestAdoption />
    </QueryProvider>
  );
}
