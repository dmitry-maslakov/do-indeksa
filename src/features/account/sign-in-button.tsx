"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { signIn } from "./auth-client";

export function GoogleSignInButton(props: ComponentProps<typeof Button>) {
  const pathname = usePathname();

  return <Button {...props} onClick={() => signIn(pathname)} />;
}
