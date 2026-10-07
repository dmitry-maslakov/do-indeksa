import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6">
      <h1 className="font-bold text-3xl">{t("title")}</h1>
      <Button render={<Link href="/" />} nativeButton={false}>
        {t("home")}
      </Button>
    </main>
  );
}
