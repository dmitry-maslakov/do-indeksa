import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const meta = useTranslations("Metadata");
  return (
    <main className="flex flex-col items-center gap-5 px-4 pt-16 pb-6 text-center md:pt-24">
      <title>{`${t("title")} · ${meta("title")}`}</title>
      <h1 className="font-bold text-2xl tracking-tight md:text-3xl">
        {t("title")}
      </h1>
      <Button variant="lime" render={<Link href="/" />} nativeButton={false}>
        {t("home")}
      </Button>
    </main>
  );
}
