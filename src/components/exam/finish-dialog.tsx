"use client";

import { useTranslations } from "next-intl";
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
import { Button } from "@/components/ui/button";

interface FinishDialogProps {
  left: number;
  pending: boolean;
  onFinish: () => void;
}

export function FinishDialog({ left, pending, onFinish }: FinishDialogProps) {
  const t = useTranslations("Exam");

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="secondary" className="w-full" />}
        disabled={pending}
      >
        {t("finish")}
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
          <AlertDialogAction onClick={onFinish}>
            {t("finish")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
