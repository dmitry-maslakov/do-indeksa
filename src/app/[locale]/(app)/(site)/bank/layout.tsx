import { getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { BankState } from "@/features/bank/filters/bank-state";

export default async function BankLayout({
  children,
}: LayoutProps<"/[locale]/bank">) {
  const t = await getTranslations("Bank");

  return (
    <main className="px-3 pt-4 pb-9 max-lg:min-h-dvh max-lg:bg-muted lg:px-10 lg:pt-2 lg:pb-15">
      <h1 className="sr-only">{t("title")}</h1>
      <NuqsAdapter>
        <BankState>{children}</BankState>
      </NuqsAdapter>
    </main>
  );
}
