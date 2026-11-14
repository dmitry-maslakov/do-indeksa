"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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

interface ExamSwitcherProps {
  groups: ExamGroup[];
  current: string;
}

type Entries = ReturnType<typeof entriesOf>;

interface ExamListProps {
  entries: Entries;
  pill: string;
}

const pickAll = { pathname: "/", query: { pick: "1" } };

function entriesOf(groups: ExamGroup[], current: string) {
  const ranked = groups.flatMap((g) => g.exams);
  return groups.map(({ exams, ...group }) => ({
    ...group,
    exams: exams.map((exam) => ({
      ...exam,
      checked: exam.id === current,
      intent: intentOf({ via: "switcher", rank: ranked.indexOf(exam) + 1 }),
    })),
  }));
}

export function ExamSwitcher({ groups, current }: ExamSwitcherProps) {
  const t = useTranslations("ExamSwitcher");
  const group = groups.find((g) => g.exams.some((e) => e.id === current));
  const exam = group?.exams.find((e) => e.id === current);
  if (!group || !exam) return null;
  const pill = t("title", { faculty: group.short, exam: exam.title });
  const entries = entriesOf(groups, current);

  return (
    <>
      <ExamMenu entries={entries} pill={pill} />
      <ExamSheet entries={entries} pill={pill} />
    </>
  );
}

function ExamMenu({ entries, pill }: ExamListProps) {
  const t = useTranslations("ExamSwitcher");

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
      <DropdownMenuContent
        aria-label={t("label")}
        aria-labelledby={undefined}
        sideOffset={12}
        className="w-75 rounded-xl p-1.5"
      >
        {entries.map((group) => (
          <DropdownMenuGroup key={group.id} className="flex flex-col pb-1">
            <DropdownMenuLabel className="px-2.5 pt-2 pb-1 font-normal text-subtle">
              {t("group", { faculty: group.short, city: group.city })}
            </DropdownMenuLabel>
            {group.exams.map((exam) => (
              <DropdownMenuItem
                key={exam.id}
                role="menuitemradio"
                aria-checked={exam.checked}
                onClick={() => rememberExam(exam.id)}
                render={
                  <Link exam={exam.path} href="/" data-intent={exam.intent} />
                }
                className="h-10 gap-2.5 rounded-md px-2.5 font-medium aria-checked:bg-muted"
              >
                <ExamBadge exam={exam} size="pill" />
                <span className="min-w-0 flex-1">{exam.name}</span>
                {exam.checked && <CheckIcon />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
        <DropdownMenuSeparator className="mx-1 mt-0.5 mb-1.5" />
        <DropdownMenuItem
          render={<Link exam={null} href={pickAll} />}
          className="h-10 justify-between rounded-md px-2.5 font-medium text-data focus:text-data not-data-[variant=destructive]:focus:**:text-data"
        >
          {t("all")}
          <span aria-hidden="true">→</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExamSheet({ entries, pill }: ExamListProps) {
  const t = useTranslations("ExamSwitcher");
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-full bg-untouched pr-2 pl-3 font-medium text-[13px] leading-4.5 md:hidden"
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
          {entries.map((group) => {
            const label = t("group", {
              faculty: group.short,
              city: group.city,
            });
            return (
              <div key={group.id}>
                <p
                  aria-hidden="true"
                  className="pt-2.5 pb-1 text-subtle text-xs"
                >
                  {label}
                </p>
                <ul aria-label={label}>
                  {group.exams.map((exam) => (
                    <li key={exam.id} className="-mx-2 flex">
                      <Link
                        exam={exam.path}
                        href="/"
                        aria-current={exam.checked || undefined}
                        data-intent={exam.intent}
                        onClick={() => {
                          rememberExam(exam.id);
                          setOpen(false);
                        }}
                        className="flex min-h-12 flex-1 items-center gap-3 rounded-lg px-2 font-medium text-[15px] leading-5 aria-[current]:bg-muted"
                      >
                        <ExamBadge exam={exam} size="pill" />
                        <span className="min-w-0 flex-1">{exam.name}</span>
                        {exam.checked && <CheckIcon className="size-4.5" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <hr className="my-2" />
          <Link
            exam={null}
            href={pickAll}
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center justify-between font-medium text-[15px] text-data leading-5"
          >
            {t("all")}
            <span aria-hidden="true">→</span>
          </Link>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
