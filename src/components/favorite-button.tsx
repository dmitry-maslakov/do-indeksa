"use client";

import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ComponentProps,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { SignInButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { isFavorite, setFavorite } from "@/server/favorites";

export function FavoriteButton({ taskId }: { taskId: string }) {
  const t = useTranslations("Solve");
  const { data: session, isPending } = authClient.useSession();
  const [saved, setSaved] = useState(false);
  const [shown, setShown] = useOptimistic(saved);
  const [, startTransition] = useTransition();

  const userId = session?.user.id;

  useEffect(() => {
    if (userId) isFavorite(taskId).then(setSaved);
    else setSaved(false);
  }, [userId, taskId]);

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
    disabled: isPending,
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

  if (!session) return <SignInButton {...props}>{star}</SignInButton>;

  return (
    <Button {...props} onClick={toggle} aria-pressed={shown}>
      {star}
    </Button>
  );
}
