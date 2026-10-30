import { useTranslations } from "next-intl";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { NotFoundShown } from "./_components/not-found-shown";
import { Shell } from "./_components/shell/shell";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const meta = useTranslations("Metadata");
  return (
    <Shell>
      <main className="flex flex-col items-center gap-5 px-4 pt-16 pb-6 text-center md:pt-24">
        <title>{`${t("title")} · ${meta("title")}`}</title>
        <NotFoundShown />
        <PageTitle>{t("title")}</PageTitle>
        <Button variant="lime" render={<Link href="/" />} nativeButton={false}>
          {t("home")}
        </Button>
      </main>
    </Shell>
  );
}
