import { cn } from "cn";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/features/account/user-menu";
import { ExamSwitcher } from "@/features/catalog/exam-switcher";
import { examOptions } from "@/features/catalog/exams";
import { NavLinks } from "./nav-links";

interface TopNavProps {
  exam?: string;
  languages: boolean;
  className?: string;
}

export function TopNav({ exam, languages, className }: TopNavProps) {
  return (
    <header
      className={cn(
        "flex h-14 items-center gap-4 px-4 lg:h-18 lg:gap-7 lg:px-10",
        className,
      )}
    >
      <Logo />
      {exam && (
        <>
          <div className="max-lg:hidden">
            <ExamSwitcher exams={examOptions} current={exam} />
          </div>
          <NavLinks />
        </>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-4">
        {languages && <LocaleSwitcher />}
        <UserMenu />
      </div>
    </header>
  );
}
