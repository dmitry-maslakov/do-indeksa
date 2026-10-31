import type { Metadata, Viewport } from "next";
import { Golos_Text } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { PageAnalytics } from "./_components/page-analytics";
import "../globals.css";

const golos = Golos_Text({
  subsets: ["latin", "latin-ext"],
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
    metadataBase: siteUrl,
    openGraph: { type: "website", siteName: t("title") },
    twitter: { card: "summary" },
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
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Suspense>
          <PageAnalytics />
        </Suspense>
      </body>
    </html>
  );
}
