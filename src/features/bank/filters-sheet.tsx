"use client";

import { Drawer } from "@base-ui/react/drawer";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface FiltersSheetProps {
  active: number;
  count: number;
  children: ReactNode;
}

export function FiltersSheet({ active, count, children }: FiltersSheetProps) {
  const t = useTranslations("Bank");

  return (
    <Drawer.Root>
      <Drawer.Trigger
        render={
          <Button
            variant="ghost"
            className="h-11 rounded-xl bg-card px-4 font-medium text-sm"
          />
        }
      >
        {t("filters", { count: active })}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-50 bg-foreground/30" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end">
          <Drawer.Popup className="flex max-h-[calc(100dvh-2.5rem)] w-full flex-col rounded-t-3xl bg-card pb-[env(safe-area-inset-bottom)] shadow-sheet outline-none [transform:translateY(var(--drawer-swipe-movement-y))]">
            <span
              aria-hidden="true"
              className="mx-auto my-3 h-1 w-10 shrink-0 rounded-full bg-input"
            />
            <Drawer.Title className="sr-only">
              {t("filters", { count: 0 })}
            </Drawer.Title>
            <Drawer.Content className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
              {children}
            </Drawer.Content>
            <div className="border-t px-4 pt-3 pb-4">
              <Drawer.Close
                render={
                  <Button
                    variant="lime"
                    className="h-12 w-full rounded-full font-medium text-base"
                  />
                }
              >
                {t("show", { count })}
              </Drawer.Close>
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
