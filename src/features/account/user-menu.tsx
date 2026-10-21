"use client";

import { LogOutIcon, ShieldIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { authClient } from "./auth-client";
import { SignInButton } from "./sign-in-button";
import { useSignedOut } from "./use-signed-out";

export function UserMenu() {
  const t = useTranslations("UserMenu");
  const signedOut = useSignedOut();
  const { data, isPending } = authClient.useSession();

  if (isPending) return <Skeleton className="size-9" />;

  if (!data) {
    return (
      <SignInButton variant="tint" size="sm" className="px-3 sm:px-4">
        {t("signIn")}
      </SignInButton>
    );
  }

  const { user } = data;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full" aria-label={t("account")}>
        <Avatar className="size-9 after:hidden">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="bg-muted font-semibold text-foreground text-sm">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-foreground">{user.name}</span>
            <span className="font-normal text-subtle text-xs">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/privacy" />}>
          <ShieldIcon />
          {t("privacy")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            authClient.signOut({ fetchOptions: { onSuccess: signedOut } })
          }
        >
          <LogOutIcon />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
