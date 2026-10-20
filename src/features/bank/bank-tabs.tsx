import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { positions } from "@/features/exam/exam";

export function BankTabs({ topic }: { topic?: string | null }) {
  const t = useTranslations("Bank");
  return (
    <LinkTabs
      variant="fill"
      items={[
        {
          href: `/bank/start/${topic ?? positions[0]?.topic}`,
          label: t("recommended"),
          active: false,
        },
        { href: "/bank", label: t("all"), active: true },
      ]}
    />
  );
}
