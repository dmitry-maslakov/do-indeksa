"use client";

import { ArrowRightIcon, CheckIcon, ChevronDownIcon } from "lucide-react";
import { type Locale, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { intentOf } from "@/lib/analytics-browser";
import { rememberExam } from "@/lib/cookies";
import { ExamBadge } from "./exam-badge";
import type { ExamGroup } from "./exams";

type SwitcherExam = ExamGroup["exams"][number];

interface ExamSwitcherProps {
  groups: ExamGroup[];
  current: string;
}

interface ExamListProps extends ExamSwitcherProps {
  pill: string;
}

const pickAll = { pathname: "/", query: { pick: "1" } };

function nameOf({ name, label }: SwitcherExam, locale: Locale) {
  const labels: Partial<Record<Locale, string>> = label ?? {};
  return labels[locale] ?? name;
}

function useRanked(groups: ExamGroup[]) {
  const locale = useLocale();
  const ranks = new Map(
    groups.flatMap((g) => g.exams).map((e, i) => [e.id, i + 1]),
  );
  return (exam: SwitcherExam) => ({
    name: nameOf(exam, locale),
    intent: intentOf({ via: "switcher", rank: ranks.get(exam.id) }),
  });
}

export function ExamSwitcher({ groups, current }: ExamSwitcherProps) {
  const t = useTranslations("ExamSwitcher");
  const group = groups.find((g) => g.exams.some((e) => e.id === current));
  const exam = group?.exams.find((e) => e.id === current);
  if (!group || !exam) return null;
  const pill = t("title", { faculty: group.short, exam: exam.title });

  return (
    <>
      <ExamMenu groups={groups} current={current} pill={pill} />
      <ExamSheet groups={groups} current={current} pill={pill} />
    </>
  );
}

function ExamMenu({ groups, current, pill }: ExamListProps) {
  const t = useTranslations("ExamSwitcher");
  const ranked = useRanked(groups);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full bg-untouched pr-2.5 pl-3.5 font-medium max-md:hidden"
          />
        }
      >
        {pill}
        <ChevronDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={12} className="w-75 rounded-xl p-1.5">
        {groups.map((group) => (
          <DropdownMenuGroup key={group.id} className="flex flex-col pb-1">
            <DropdownMenuLabel className="px-2.5 pt-2 pb-1 font-normal text-subtle">
              {t("group", { faculty: group.short, city: group.city })}
            </DropdownMenuLabel>
            {group.exams.map((exam) => {
              const { name, intent } = ranked(exam);
              const checked = exam.id === current;
              return (
                <DropdownMenuItem
                  key={exam.id}
                  role="menuitemradio"
                  aria-checked={checked}
                  onClick={() => rememberExam(exam.id)}
                  render={
                    <Link exam={exam.path} href="/" data-intent={intent} />
                  }
                  className="h-10 gap-2.5 rounded-md px-2.5 font-medium aria-checked:bg-muted"
                >
                  <ExamBadge exam={exam} size="pill" />
                  <span className="min-w-0 flex-1">{name}</span>
                  {checked && <CheckIcon />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
        <DropdownMenuSeparator className="mx-1 mt-0.5 mb-1.5" />
        <DropdownMenuItem
          render={<Link exam={null} href={pickAll} />}
          className="h-10 justify-between rounded-md px-2.5 font-medium text-data focus:text-data not-data-[variant=destructive]:focus:**:text-data"
        >
          {t("all")}
          <ArrowRightIcon />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExamSheet({ groups, current, pill }: ExamListProps) {
  const t = useTranslations("ExamSwitcher");
  const ranked = useRanked(groups);
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-full bg-untouched pr-2 pl-3 font-medium text-[13px] md:hidden"
          />
        }
      >
        {pill}
        <ChevronDownIcon className="size-3.5" />
      </DrawerTrigger>
      <DrawerContent title={t("label")}>
        <DrawerBody className="flex flex-col overflow-y-auto px-4 pb-6">
          <p
            aria-hidden="true"
            className="mb-1 font-semibold text-[17px] leading-6"
          >
            {t("label")}
          </p>
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col">
              <p className="pt-2.5 pb-1 text-subtle text-xs">
                {t("group", { faculty: group.short, city: group.city })}
              </p>
              {group.exams.map((exam) => {
                const { name, intent } = ranked(exam);
                const checked = exam.id === current;
                return (
                  <Link
                    key={exam.id}
                    exam={exam.path}
                    href="/"
                    aria-current={checked || undefined}
                    data-intent={intent}
                    onClick={() => {
                      rememberExam(exam.id);
                      setOpen(false);
                    }}
                    className="-mx-2 flex min-h-12 items-center gap-3 rounded-lg px-2 font-medium text-[15px] leading-5 aria-[current]:bg-muted"
                  >
                    <ExamBadge exam={exam} size="pill" />
                    <span className="min-w-0 flex-1">{name}</span>
                    {checked && <CheckIcon className="size-4.5" />}
                  </Link>
                );
              })}
            </div>
          ))}
          <hr className="my-2" />
          <Link
            exam={null}
            href={pickAll}
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center justify-between font-medium text-[15px] text-data leading-5"
          >
            {t("all")}
            <ArrowRightIcon className="size-4.5" />
          </Link>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
