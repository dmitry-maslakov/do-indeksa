"use client";

import { ChevronDownIcon, ChevronLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { TopicIcon } from "@/features/tasks/topic-icon";
import type { Tone, TopicIconData } from "@/features/tasks/topic-look";
import { Link } from "@/i18n/navigation";
import { Rail, type RailProps } from "./rail";

interface PhoneBarProps extends RailProps {
  title: string;
  look: { icon: TopicIconData; tone: Tone };
}

export function PhoneBar({ title, look, ...rail }: PhoneBarProps) {
  const t = useTranslations("Solve");

  return (
    <Drawer>
      <div className="-mx-2 flex h-14 items-center gap-1 md:hidden">
        <Link
          href={`/bank${rail.query}`}
          aria-label={t("back")}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <DrawerTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1 text-left font-semibold text-base">
          <TopicIcon icon={look.icon} tone={look.tone} size="sm" />
          <span className="truncate">{title}</span>
          <ChevronDownIcon className="size-4 shrink-0" />
        </DrawerTrigger>
      </div>
      <DrawerContent title={t("sheet")} className="h-3/5">
        <Rail {...rail} variant="sheet" />
      </DrawerContent>
    </Drawer>
  );
}
