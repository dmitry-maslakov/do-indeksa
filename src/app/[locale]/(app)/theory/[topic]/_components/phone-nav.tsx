import { ChevronLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { LinkTabs } from "@/components/link-tabs";
import { Link } from "@/i18n/navigation";

export function BackBar({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-mx-2 mb-2 flex h-12 w-fit items-center gap-2 rounded-xl px-2 font-semibold md:hidden"
    >
      <ChevronLeftIcon aria-hidden="true" className="size-5.5" />
      {label}
    </Link>
  );
}

interface PhoneTabsProps {
  topic: string;
  methods: number;
  active: "theory" | "methods";
}

export function PhoneTabs({ topic, methods, active }: PhoneTabsProps) {
  const t = useTranslations("Theory");
  return (
    <div className="md:hidden">
      <LinkTabs
        variant="fill"
        items={[
          {
            href: `/theory/${topic}`,
            label: t("theory"),
            active: active === "theory",
          },
          {
            href: `/theory/${topic}/methods`,
            label: t("methodsCount", { count: methods }),
            active: active === "methods",
          },
        ]}
      />
    </div>
  );
}
