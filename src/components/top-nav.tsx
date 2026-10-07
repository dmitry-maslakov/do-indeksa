import { allExams } from "content-collections";
import { Link } from "@/i18n/navigation";
import { type ExamOption, ExamSwitcher } from "./exam-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { NavLinks } from "./nav-links";
import { StreakBadge } from "./streak-badge";
import { UserMenu } from "./user-menu";

const exams: ExamOption[] = allExams.map((e) => ({
  id: e.id,
  faculty: e.faculty,
  title: e.title,
  tasks: e.positions.length,
  hours: e.durationMinutes / 60,
}));

export function TopNav() {
  return (
    <header className="flex flex-wrap items-center gap-x-3 px-4 md:h-17 md:flex-nowrap md:gap-x-7 md:px-9">
      <Link
        href="/"
        className="flex h-14 items-center font-bold text-lg tracking-tight md:h-auto"
      >
        <span className="sm:hidden">di</span>
        <span className="hidden sm:inline">do indeksa</span>
      </Link>
      <ExamSwitcher exams={exams} current="ftn-p1" />
      <NavLinks />
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <StreakBadge />
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
