"use client";

import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FinishDialogProps {
  left: number;
  pending: boolean;
  onFinish: () => void;
  trigger: ReactElement;
  children: ReactNode;
}

export function FinishDialog({
  left,
  pending,
  onFinish,
  trigger,
  children,
}: FinishDialogProps) {
  const t = useTranslations("Exam");

  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} disabled={pending}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("finishTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {left > 0 ? t("finishLeft", { count: left }) : t("finishAll")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={onFinish}>
            {t("finish")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
