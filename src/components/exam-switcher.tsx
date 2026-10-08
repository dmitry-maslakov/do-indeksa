"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExamOption {
  id: string;
  faculty: string;
  title: string;
  tasks: number;
  hours: number;
}

interface ExamSwitcherProps {
  exams: ExamOption[];
  current: string;
}

export function ExamSwitcher({ exams, current }: ExamSwitcherProps) {
  const t = useTranslations("ExamSwitcher");
  const selected = exams.find((e) => e.id === current);
  const faculties = [...new Set(exams.map((e) => e.faculty))];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="bg-card shadow-raised" />
        }
      >
        {selected?.title}
        <ChevronDownIcon className="text-subtle" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-2">
        <DropdownMenuRadioGroup value={current}>
          {faculties.map((faculty) => (
            <DropdownMenuGroup key={faculty}>
              <DropdownMenuLabel className="text-subtle text-xs">
                {faculty}
              </DropdownMenuLabel>
              {exams
                .filter((e) => e.faculty === faculty)
                .map((e) => (
                  <DropdownMenuRadioItem
                    key={e.id}
                    value={e.id}
                    className="flex-col items-start gap-0.5 py-2 data-checked:bg-data-tint data-checked:text-data"
                  >
                    <span className="font-medium">{e.title}</span>
                    <span className="text-subtle text-xs">
                      {t("meta", { tasks: e.tasks, hours: e.hours })}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-sm text-subtle">{t("more")}</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
