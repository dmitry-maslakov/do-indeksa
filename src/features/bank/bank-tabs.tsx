import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { positions } from "@/features/exam/exam";

interface BankTabsProps {
  topic?: string | null;
  pending?: boolean;
}

export function BankTabs({ topic, pending }: BankTabsProps) {
  const t = useTranslations("Bank");
  if (pending) return <Skeleton className="h-10 rounded-xl" />;
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
