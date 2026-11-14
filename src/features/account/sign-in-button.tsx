"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import type { SignInSource } from "@/server/sign-up-source";
import { signIn } from "./auth-client";

interface GoogleSignInButtonProps extends ComponentProps<typeof Button> {
  from: SignInSource;
}

export function GoogleSignInButton({
  from,
  ...props
}: GoogleSignInButtonProps) {
  return (
    <Button
      {...props}
      onClick={() => signIn(location.pathname + location.search, from)}
    />
  );
}
