"use client";

import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimisticAction } from "next-safe-action/hooks";
import { type ComponentProps, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/features/account/sign-in-button";
import { useErrorText } from "@/lib/use-error-text";
import { setFavorite } from "./favorite-action";

interface FavoriteButtonProps {
  taskId: string;
  saved?: boolean;
  signedIn?: boolean;
  pending?: boolean;
}

export function FavoriteButton({
  taskId,
  saved: initial = false,
  signedIn = false,
  pending = false,
}: FavoriteButtonProps) {
  const t = useTranslations("Solve");
  const errorText = useErrorText();
  const [saved, setSaved] = useState(initial);
  const { execute, optimisticState: shown } = useOptimisticAction(setFavorite, {
    currentState: saved,
    updateFn: (_, { favorite }) => favorite,
    onSuccess: ({ data }) => setSaved(data),
    onError: ({ error }) => toast.error(errorText(error.serverError)),
  });
  const toggle = () => execute({ taskId, favorite: !shown });

  const label = shown ? t("saved") : t("save");
  const props = {
    variant: "ghost",
    size: "sm",
    disabled: pending,
    "aria-label": label,
    className: "-mr-2 bg-transparent px-2 sm:px-4",
  } satisfies ComponentProps<typeof Button>;
  const star = (
    <>
      <StarIcon
        className={cn("text-subtle", shown && "fill-overtime text-overtime")}
      />
      <span className="hidden sm:inline">{label}</span>
    </>
  );

  if (!signedIn) return <SignInButton {...props}>{star}</SignInButton>;

  return (
    <Button {...props} onClick={toggle} aria-pressed={shown}>
      {star}
    </Button>
  );
}
