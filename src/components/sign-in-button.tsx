"use client";

import { useTranslations } from "next-intl";
import { type ComponentProps, useState } from "react";
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
import { Link, usePathname } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";

export function GoogleSignInButton(props: ComponentProps<typeof Button>) {
  const pathname = usePathname();

  return <Button {...props} onClick={() => signIn(pathname)} />;
}

export function PrivacyLink({ onClick }: { onClick?: () => void }) {
  const t = useTranslations("Account");

  return (
    <Link
      href="/privacy"
      onClick={onClick}
      className="text-[13px] text-primary underline-offset-4 hover:underline"
    >
      {t("privacy")}
    </Link>
  );
}

export function SignInButton(props: ComponentProps<typeof Button>) {
  const t = useTranslations("Account");
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button {...props} />} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription
            render={<div />}
            className="grid gap-1.5 text-subtle"
          >
            <p>{t("text")}</p>
            <p className="text-[13px] text-wrap">{t("stores")}</p>
          </AlertDialogDescription>
          <PrivacyLink onClick={() => setOpen(false)} />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="tint">{t("later")}</AlertDialogCancel>
          <GoogleSignInButton variant="tint">{t("signIn")}</GoogleSignInButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
