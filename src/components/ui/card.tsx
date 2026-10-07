import { cn } from "cn";
import type * as React from "react";

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 rounded-3xl bg-card p-(--card-spacing) text-card-foreground shadow-card [--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(4)] md:[--card-spacing:--spacing(7)] md:data-[size=sm]:[--card-spacing:--spacing(5)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn("font-semibold text-lg", className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="card-description"
      className={cn("text-sm text-subtle", className)}
      {...props}
    />
  );
}

export { Card, CardDescription, CardHeader, CardTitle };
