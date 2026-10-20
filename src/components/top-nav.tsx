import { UserMenu } from "@/features/account/user-menu";
import { currentExam, examOptions } from "@/features/exam/exam";
import { ExamSwitcher } from "@/features/exam/exam-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";

export function TopNav() {
  return (
    <header className="flex h-14 items-center gap-4 px-4 max-md:task-focus:hidden lg:h-18 lg:gap-7 lg:px-10">
      <Logo />
      <div className="max-lg:hidden">
        <ExamSwitcher exams={examOptions} current={currentExam} />
      </div>
      <NavLinks />
      <div className="ml-auto flex shrink-0 items-center gap-4">
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
