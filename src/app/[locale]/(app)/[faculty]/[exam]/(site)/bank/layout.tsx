import { NuqsAdapter } from "nuqs/adapters/next/app";
import { BankState } from "@/features/bank/filters/bank-state";

export default function BankLayout({
  children,
}: LayoutProps<"/[locale]/[faculty]/[exam]/bank">) {
  return (
    <main className="px-3 pt-4 pb-9 max-lg:min-h-dvh max-lg:bg-muted lg:px-10 lg:pt-2 lg:pb-15">
      <NuqsAdapter>
        <BankState>{children}</BankState>
      </NuqsAdapter>
    </main>
  );
}
