"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "cn";
import type { ReactNode } from "react";

const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerClose = DrawerPrimitive.Close;
const DrawerBody = DrawerPrimitive.Content;

interface DrawerContentProps {
  title: string;
  className?: string;
  children: ReactNode;
}

function DrawerContent({ title, className, children }: DrawerContentProps) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/30" />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end">
        <DrawerPrimitive.Popup
          className={cn(
            "flex max-h-[calc(100dvh-2.5rem)] w-full flex-col rounded-t-3xl bg-card pb-[env(safe-area-inset-bottom)] shadow-sheet outline-none [transform:translateY(var(--drawer-swipe-movement-y))]",
            className,
          )}
        >
          <span
            aria-hidden="true"
            className="mx-auto my-3 h-1 w-10 shrink-0 rounded-full bg-input"
          />
          <DrawerPrimitive.Title className="sr-only">
            {title}
          </DrawerPrimitive.Title>
          {children}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

export { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger };
