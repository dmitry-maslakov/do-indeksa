import { cn } from "cn";
import type * as React from "react";

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" | "lg" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 rounded-3xl bg-card p-6 text-card-foreground shadow-card data-[size=sm]:p-4 md:px-7 md:data-[size=lg]:px-8 md:data-[size=sm]:p-4.5 md:data-[size=lg]:py-7",
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
      className={cn(
        "font-semibold text-base group-data-[size=lg]/card:text-lg",
        className,
      )}
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
      className={cn("text-[13px] text-subtle", className)}
      {...props}
    />
  );
}

export { Card, CardDescription, CardHeader, CardTitle };
