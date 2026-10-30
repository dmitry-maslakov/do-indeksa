"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import type { SignInSource } from "@/server/sign-up-source";
import { signIn } from "./auth-client";

interface GoogleSignInButtonProps extends ComponentProps<typeof Button> {
  from: SignInSource;
}

export function GoogleSignInButton({
  from,
  ...props
}: GoogleSignInButtonProps) {
  const pathname = usePathname();

  return <Button {...props} onClick={() => signIn(pathname, from)} />;
}
