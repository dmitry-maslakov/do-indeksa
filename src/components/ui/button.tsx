import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-[filter,background-color] duration-150 outline-none select-none hover:brightness-96 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        lime: "bg-lime text-foreground hover:bg-lime-strong",
        quiet:
          "bg-transparent text-foreground hover:bg-muted hover:brightness-100",
        secondary: "bg-data text-primary-foreground",
        tint: "bg-data-tint text-data",
        destructive: "bg-error-tint text-error-text",
        ghost: "bg-muted text-foreground",
        inverse: "bg-white text-daily",
        link: "text-primary underline-offset-4 hover:underline hover:brightness-100",
      },
      size: {
        default: "h-11 gap-2 px-6 text-[15px]",
        sm: "h-9 gap-1.5 px-4 text-sm",
        icon: "size-11",
        "icon-sm": "size-9",
        pill: "h-12 gap-2 rounded-full px-6 font-medium text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
