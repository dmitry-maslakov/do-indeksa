"use client";

import { ChevronDownIcon, ChevronLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { TopicIcon } from "@/features/catalog/topic-icon";
import type { Tone, TopicIconData } from "@/features/catalog/topic-look";
import { Link } from "@/i18n/navigation";
import { queueEvent } from "@/lib/analytics-browser";
import { Rail, type RailProps } from "./rail";

interface PhoneBarProps extends RailProps {
  title: string;
  look: { icon: TopicIconData; tone: Tone };
}

export function PhoneBar({ title, look, ...rail }: PhoneBarProps) {
  const t = useTranslations("Solve");
  const [open, setOpen] = useState(false);

  useEffect(() => () => setOpen(false), []);

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) queueEvent("control_used", { control: "rail_sheet" });
      }}
    >
      <div className="-mx-2 flex h-14 items-center gap-1 md:hidden">
        <Link
          href={`/bank${rail.listQuery}`}
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
      <DrawerContent title={t("sheet")} className="h-full">
        <Rail {...rail} variant="sheet" />
      </DrawerContent>
    </Drawer>
  );
}
