import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { firstTaskId } from "./search";

export function BankTabs() {
  const t = useTranslations("Bank");
  return (
    <LinkTabs
      variant="fill"
      items={[
        {
          href: firstTaskId ? `/bank/${firstTaskId}` : "/bank",
          label: t("recommended"),
          active: false,
        },
        { href: "/bank", label: t("all"), active: true },
      ]}
    />
  );
}
