import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { positions } from "@/content/exam";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const golos = readFile(
  join(process.cwd(), "src/app/[locale]/launch/golos-text-bold.ttf"),
);

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Launch" });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#2b2560",
        color: "#ffffff",
        fontFamily: "Golos",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 32 }}>do indeksa</div>
        <div style={{ fontSize: 28, color: "#b4b3ba" }}>{t("eyebrow")}</div>
        <div style={{ fontSize: 64, lineHeight: 1.1, maxWidth: 960 }}>
          {t("title")}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {positions.map((p) => (
            <div
              key={p.number}
              style={{
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                background: "#6356f6",
                fontSize: 24,
              }}
            >
              {p.number}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            padding: "10px 20px",
            borderRadius: 10,
            background: "#efeefe",
            color: "#3f37a8",
            fontSize: 24,
          }}
        >
          {t("soon")}
        </div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Golos", data: await golos, weight: 700 }] },
  );
}
