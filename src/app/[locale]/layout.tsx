import type { Metadata, Viewport } from "next";
import { Golos_Text } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
import { routing } from "@/i18n/routing";
import "../globals.css";

const golos = Golos_Text({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-sans",
});

export const viewport: Viewport = { viewportFit: "cover" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} className={golos.variable}>
      <body>
        <NextIntlClientProvider>
          <TopNav />
          {children}
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
