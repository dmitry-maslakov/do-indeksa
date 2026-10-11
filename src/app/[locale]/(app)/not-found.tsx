import { useTranslations } from "next-intl";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const meta = useTranslations("Metadata");
  return (
    <main className="flex flex-col items-center gap-6 px-4 py-24">
      <title>{`${t("title")} · ${meta("title")}`}</title>
      <PageTitle className="p-0">{t("title")}</PageTitle>
      <Button render={<Link href="/" />} nativeButton={false}>
        {t("home")}
      </Button>
    </main>
  );
}
