import { cn } from "cn";
import type { ReactNode } from "react";
import { examOf } from "@/features/catalog/exams";
import { ExamBase } from "@/i18n/navigation";
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

function ExamNav({ exam, children }: { exam?: string; children: ReactNode }) {
  return exam ? (
    <ExamBase path={examOf(exam).path}>{children}</ExamBase>
  ) : (
    children
  );
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
        "mx-auto max-w-320",
        exam &&
          "max-lg:pb-[calc(var(--nav-bottom)+env(safe-area-inset-bottom))]",
        mode === "task" && "max-md:[--nav-bottom:0rem]",
        mode === "exam" && "[--nav-bottom:0rem]",
      )}
    >
      <ExamNav exam={exam}>
        <TopNav
          exam={exam}
          languages={languages}
          className={cn(mode !== "site" && "max-md:hidden")}
        />
      </ExamNav>
      {children}
      {mode !== "exam" && (
        <>
          <Footer
            note={note}
            className={cn(mode === "task" && "max-md:hidden")}
          />
          {exam && (
            <ExamNav exam={exam}>
              <BottomNav className={cn(mode === "task" && "max-md:hidden")} />
            </ExamNav>
          )}
        </>
      )}
    </div>
  );
}
