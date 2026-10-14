"use client";

import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ComponentProps,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/features/account/sign-in-button";
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
  const [saved, setSaved] = useState(initial);
  const [shown, setShown] = useOptimistic(saved);
  const [, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setShown(!saved);
      setSaved(await setFavorite(taskId, !saved));
    });
  }

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
