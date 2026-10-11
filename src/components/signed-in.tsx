"use client";

import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

export function SignedIn({
  signedIn,
  children,
}: {
  signedIn?: boolean;
  children: ReactNode;
}) {
  const { data } = authClient.useSession();
  return (signedIn ?? Boolean(data)) && children;
}
