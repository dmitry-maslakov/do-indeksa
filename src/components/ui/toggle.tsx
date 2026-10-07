"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cn } from "cn";

function Toggle({ className, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(
        "rounded-full bg-muted px-3 py-1 text-[13px] text-subtle outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-pressed:bg-data-tint data-pressed:text-data",
        className,
      )}
      {...props}
    />
  );
}

export { Toggle };
