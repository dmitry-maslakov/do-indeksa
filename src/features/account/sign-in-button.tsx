"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { signIn } from "./auth-client";
import type { SignInSource } from "./sign-up-source";

interface GoogleSignInButtonProps extends ComponentProps<typeof Button> {
  from?: SignInSource;
}

export function GoogleSignInButton({
  from,
  ...props
}: GoogleSignInButtonProps) {
  const pathname = usePathname();

  return <Button {...props} onClick={() => signIn(pathname, from)} />;
}
