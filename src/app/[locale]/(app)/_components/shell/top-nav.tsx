import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/features/account/user-menu";
import { ExamSwitcher } from "@/features/catalog/exam-switcher";
import { currentExam, examOptions } from "@/features/catalog/exams";
import { NavLinks } from "./nav-links";

export function TopNav() {
  return (
    <header className="flex h-14 items-center gap-4 px-4 max-md:focused:hidden lg:h-18 lg:gap-7 lg:px-10">
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
