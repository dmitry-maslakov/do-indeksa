import { cn } from "cn";
import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { Footer } from "./footer";
import { TopNav } from "./top-nav";

interface ShellProps {
  mode?: "site" | "read" | "task" | "exam";
  exam?: string;
  languages?: boolean;
  note?: ReactNode;
  children: ReactNode;
}

export function Shell({
  mode = "site",
  exam,
  languages = true,
  note,
  children,
}: ShellProps) {
  return (
    <div
      className={cn(
        exam &&
          "max-lg:pb-[calc(var(--nav-bottom)+env(safe-area-inset-bottom))]",
        mode === "task" && "max-md:[--nav-bottom:0rem]",
        mode === "exam" && "[--nav-bottom:0rem]",
      )}
    >
      <TopNav
        exam={exam}
        languages={languages}
        className={cn(mode !== "site" && "max-md:hidden")}
      />
      {children}
      {mode !== "exam" && (
        <>
          <Footer
            note={note}
            className={cn(mode === "task" && "max-md:hidden")}
          />
          {exam && (
            <BottomNav className={cn(mode === "task" && "max-md:hidden")} />
          )}
        </>
      )}
    </div>
  );
}
