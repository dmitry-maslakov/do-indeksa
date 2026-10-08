"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";

export function SignInButton(props: ComponentProps<typeof Button>) {
  const pathname = usePathname();

  return <Button {...props} onClick={() => signIn(pathname)} />;
}
