import { UserMenu } from "@/features/account/user-menu";
import { currentExam, examOptions } from "@/features/exam/exam";
import { ExamSwitcher } from "@/features/exam/exam-switcher";
import { StreakBadge } from "@/features/progress/streak-badge";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";

export function TopNav() {
  return (
    <header className="flex h-14 items-center gap-x-2 px-4 sm:gap-x-3 md:h-17 md:gap-x-7 md:px-9">
      <Logo />
      <ExamSwitcher exams={examOptions} current={currentExam} />
      <NavLinks />
      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        <StreakBadge />
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
