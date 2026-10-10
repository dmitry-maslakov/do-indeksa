"use client";

import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";

export function GoogleSignInButton(props: ComponentProps<typeof Button>) {
  const pathname = usePathname();

  return <Button {...props} onClick={() => signIn(pathname)} />;
}

export function SignInButton(props: ComponentProps<typeof Button>) {
  const t = useTranslations("Account");

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button {...props} />} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("text")}</AlertDialogDescription>
          <p className="text-[13px] text-subtle">{t("stores")}</p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="tint">{t("later")}</AlertDialogCancel>
          <GoogleSignInButton variant="tint">{t("signIn")}</GoogleSignInButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
