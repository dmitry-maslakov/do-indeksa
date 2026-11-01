"use client";

import { ChevronDownIcon, ChevronLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { TopicIcon } from "@/features/catalog/topic-icon";
import type { Tone, TopicIconData } from "@/features/catalog/topic-look";
import { Link } from "@/i18n/navigation";
import { queueEvent } from "@/lib/analytics-browser";
import { VisitPosition } from "../../_components/queue-progress";
import { Rail } from "../../_components/rail";

interface PhoneBarProps {
  title: string;
  listHref: string;
  look: { icon: TopicIconData; tone: Tone };
}

export function PhoneBar({ title, listHref, look }: PhoneBarProps) {
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
          href={listHref}
          aria-label={t("back")}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <DrawerTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1 text-left font-semibold text-base">
          <TopicIcon icon={look.icon} tone={look.tone} size="sm" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate leading-5">{title}</span>
            <span className="h-4 truncate font-normal text-subtle text-xs leading-4">
              <VisitPosition />
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0" />
        </DrawerTrigger>
      </div>
      <DrawerContent
        title={t("sheet")}
        className="h-full max-h-[calc(100dvh-4rem)]"
      >
        <Rail variant="sheet" />
      </DrawerContent>
    </Drawer>
  );
}
