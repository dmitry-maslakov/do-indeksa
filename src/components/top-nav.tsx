import { allExams } from "content-collections";
import { Link } from "@/i18n/navigation";
import { type ExamOption, ExamSwitcher } from "./exam-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { NavLinks } from "./nav-links";

const exams: ExamOption[] = allExams.map((e) => ({
  id: e.id,
  faculty: e.faculty,
  title: e.title,
  tasks: e.positions.length,
  hours: e.durationMinutes / 60,
}));

export function TopNav() {
  return (
    <header className="flex flex-wrap items-center gap-x-4 px-4 md:h-17 md:flex-nowrap md:gap-x-7 md:px-9">
      <Link
        href="/"
        className="flex h-14 items-center font-bold text-lg tracking-tight md:h-auto"
      >
        do indeksa
      </Link>
      <ExamSwitcher exams={exams} current="ftn-p1" />
      <NavLinks />
      <LocaleSwitcher />
    </header>
  );
}
