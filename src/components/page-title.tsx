import { cn } from "cn";
import type { ComponentProps } from "react";

const sizes = {
  md: "text-2xl md:text-3xl",
  lg: "text-balance text-[32px] leading-10",
};

export function PageTitle({
  className,
  size = "md",
  ...props
}: ComponentProps<"h1"> & { size?: keyof typeof sizes }) {
  return (
    <h1
      className={cn("font-bold tracking-tight", sizes[size], className)}
      {...props}
    />
  );
}
