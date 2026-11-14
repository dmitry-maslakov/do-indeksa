import { getTranslations } from "next-intl/server";
import { RailPanel } from "@/components/rail";
import { QueueProvider } from "./_components/queue-store";
import { Rail } from "./_components/rail";

export default async function BankLayout({
  children,
}: LayoutProps<"/[locale]/[faculty]/[exam]/bank">) {
  const bank = await getTranslations("Bank");

  return (
    <QueueProvider>
      <main className="px-4 pb-28 md:px-10 md:pt-2 md:pb-15">
        <div className="md:flex md:items-start md:gap-14">
          <RailPanel label={bank("recommended")}>
            <Rail />
          </RailPanel>
          {children}
        </div>
      </main>
    </QueueProvider>
  );
}
