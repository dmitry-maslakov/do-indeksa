import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("Metadata");
  return <main>{t("title")}</main>;
}
