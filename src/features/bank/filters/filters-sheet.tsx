"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface FiltersSheetProps {
  active: number;
  count: number;
  children: ReactNode;
}

export function FiltersSheet({ active, count, children }: FiltersSheetProps) {
  const t = useTranslations("Bank");

  return (
    <Drawer>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            className="h-10 rounded-xl bg-card px-4 font-medium text-sm"
          />
        }
      >
        {t("filters", { count: active })}
      </DrawerTrigger>
      <DrawerContent title={t("filters", { count: 0 })}>
        <DrawerBody className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          {children}
        </DrawerBody>
        <div className="border-t px-4 pt-3 pb-4">
          <DrawerClose
            render={<Button variant="lime" size="pill" className="w-full" />}
          >
            {t("show", { count })}
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
