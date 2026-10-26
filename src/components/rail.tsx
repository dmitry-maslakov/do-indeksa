import { cn } from "cn";
import { type ComponentProps, type ReactNode, useId } from "react";
import { Link } from "@/i18n/navigation";
import { NativeSelect } from "./ui/native-select";

export type RailVariant = "rail" | "sheet";

export function RailPanel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <aside
      aria-label={label}
      className="sticky top-3 hidden h-rail w-80 shrink-0 flex-col overflow-hidden rounded-3xl bg-muted pt-4 md:flex"
    >
      {children}
    </aside>
  );
}

export function RailContent({
  variant = "rail",
  children,
}: {
  variant?: RailVariant;
  children: ReactNode;
}) {
  return (
    <div
      data-variant={variant}
      className="group/rail flex min-h-0 flex-1 flex-col"
    >
      {children}
    </div>
  );
}

export function RailSelect({
  label,
  ...props
}: Omit<ComponentProps<typeof NativeSelect>, "id" | "size" | "variant"> & {
  label: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </label>
      <NativeSelect
        id={id}
        size="md"
        variant="card"
        className="w-full"
        {...props}
      />
    </div>
  );
}

export function RailHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="sticky top-0 z-1 bg-muted px-2 pt-3 pb-1 font-semibold text-subtle text-xs group-data-[variant=sheet]/rail:bg-card">
      {children}
    </h3>
  );
}

const row =
  "flex w-full gap-2 rounded-lg px-2 text-left text-sm outline-none hover:bg-untouched focus-visible:ring-2 focus-visible:ring-ring aria-[current]:bg-card aria-[current]:font-semibold aria-[current]:shadow-current group-data-[variant=sheet]/rail:aria-[current]:bg-muted";

export function RailLink({
  current,
  className,
  ...props
}: ComponentProps<typeof Link> & { current?: boolean }) {
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className={cn(row, className)}
      {...props}
    />
  );
}

export function RailButton({
  current,
  className,
  ...props
}: ComponentProps<"button"> & { current?: boolean }) {
  return (
    <button
      type="button"
      aria-current={current ? "step" : undefined}
      className={cn(row, className)}
      {...props}
    />
  );
}
