"use client";

import { useLocale } from "next-intl";
import { createNavigation } from "next-intl/navigation";
import { type ComponentProps, createContext, type ReactNode, use } from "react";
import { routing } from "./routing";

const intl = createNavigation(routing);

type Router = ReturnType<typeof intl.useRouter>;
type RouterHref = Parameters<Router["push"]>[0];
type Base = string | null | undefined;

const ExamContext = createContext<string | undefined>(undefined);

export function ExamBase({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return <ExamContext value={path}>{children}</ExamContext>;
}

const useExamBase = () => use(ExamContext);

function prefixed(base: Base, pathname: string) {
  if (!base || pathname.startsWith("#") || pathname.startsWith("?"))
    return pathname;
  return pathname === "/" ? base : `${base}${pathname}`;
}

export function examHref<T extends string | { pathname?: string | null }>(
  base: Base,
  href: T,
): T {
  if (typeof href === "string") return prefixed(base, href) as T;
  const url = href as { pathname?: string | null };
  return { ...url, pathname: prefixed(base, url.pathname ?? "/") } as T;
}

export function useExamPath() {
  const base = useExamBase();
  if (!base) throw new Error("the page is outside an exam");
  return base;
}

export function Link({
  exam,
  href,
  locale,
  ...props
}: ComponentProps<typeof intl.Link> & { exam?: string | null }) {
  const current = useExamBase();
  const here = useLocale();
  return (
    <intl.Link
      href={examHref(exam === undefined ? current : exam, href)}
      locale={locale === here ? undefined : locale}
      {...props}
    />
  );
}

export function useRouter(): Router {
  const router = intl.useRouter();
  const base = useExamBase();
  return {
    ...router,
    push: (href: RouterHref, options) =>
      router.push(examHref(base, href), options),
    replace: (href: RouterHref, options) =>
      router.replace(examHref(base, href), options),
    prefetch: (href: RouterHref, options) =>
      router.prefetch(examHref(base, href), options),
  };
}

export function usePathname() {
  const pathname = intl.usePathname();
  const base = useExamBase();
  if (pathname === base) return "/";
  return base && pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length)
    : pathname;
}
