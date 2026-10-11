"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/sign-in-button";
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
import { authClient } from "@/lib/auth-client";
import { useSignedOut } from "@/lib/use-signed-out";

type Status = "idle" | "pending" | "stale" | "error" | "deleted";

export function DeleteAccount() {
  const t = useTranslations("Privacy");
  const account = useTranslations("Account");
  const signedOut = useSignedOut();
  const { data, isPending } = authClient.useSession();
  const [status, setStatus] = useState<Status>("idle");

  if (status === "deleted") {
    return (
      <p role="status" className="text-sm">
        {t("deleted")}
      </p>
    );
  }
  if (isPending) return null;
  if (!data) {
    return (
      <>
        <p className="text-sm text-subtle">{t("signedOut")}</p>
        <GoogleSignInButton size="sm" variant="tint">
          {account("signIn")}
        </GoogleSignInButton>
      </>
    );
  }

  const remove = () => {
    setStatus("pending");
    authClient.deleteUser({
      fetchOptions: {
        onSuccess: () => {
          setStatus("deleted");
          signedOut();
        },
        onError: ({ error }) =>
          setStatus(error.code === "SESSION_EXPIRED" ? "stale" : "error"),
      },
    });
  };

  return (
    <AlertDialog onOpenChange={(open) => open && setStatus("idle")}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        {t("deleteButton")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription aria-live="polite" className="text-subtle">
            {status === "stale" || status === "error"
              ? t(status)
              : t("confirm")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          {status === "stale" ? (
            <GoogleSignInButton variant="tint">
              {account("signIn")}
            </GoogleSignInButton>
          ) : (
            <AlertDialogAction
              variant="destructive"
              disabled={status === "pending"}
              onClick={remove}
            >
              {t("deleteButton")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
