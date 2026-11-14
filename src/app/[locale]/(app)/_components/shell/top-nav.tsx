import { cn } from "cn";
import { useLocale } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/features/account/user-menu";
import { ExamSwitcher } from "@/features/catalog/exam-switcher";
import { examGroups } from "@/features/catalog/exams";
import { NavLinks } from "./nav-links";

interface TopNavProps {
  exam?: string;
  languages: boolean;
  className?: string;
}

export function TopNav({ exam, languages, className }: TopNavProps) {
  const locale = useLocale();
  return (
    <header
      className={cn(
        "flex h-14 items-center gap-3 px-4 md:gap-4 lg:h-18 lg:gap-7 lg:px-10",
        className,
      )}
    >
      <Logo />
      {exam && (
        <>
          <ExamSwitcher groups={examGroups(locale)} current={exam} />
          <NavLinks />
        </>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-2.5 md:gap-4">
        {languages && <LocaleSwitcher />}
        <UserMenu />
      </div>
    </header>
  );
}
