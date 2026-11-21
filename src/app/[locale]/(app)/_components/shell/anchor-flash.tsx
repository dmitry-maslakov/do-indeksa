"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const flashClass = "animate-target";

function flash(hash: string) {
  const target = hash && document.getElementById(hash.slice(1));
  if (!target) return;
  const label = target.getAttribute("aria-labelledby");
  const element = (label && document.getElementById(label)) || target;
  element.classList.remove(flashClass);
  element.getBoundingClientRect();
  element.classList.add(flashClass);
  element.addEventListener(
    "animationend",
    () => element.classList.remove(flashClass),
    { once: true },
  );
}

function afterScroll(run: () => void) {
  if (!("onscrollend" in window)) return run();
  const finish = () => {
    clearTimeout(idle);
    removeEventListener("scroll", moving);
    removeEventListener("scrollend", finish);
    run();
  };
  const moving = () => clearTimeout(idle);
  const idle = setTimeout(finish, 200);
  addEventListener("scroll", moving, { once: true });
  addEventListener("scrollend", finish, { once: true });
}

function Arrival() {
  useEffect(() => flash(location.hash), []);
  return null;
}

export function AnchorFlash() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey) return;
      if (event.shiftKey || event.altKey) return;
      const link =
        event.target instanceof Element && event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target) return;
      if (link.origin !== location.origin) return;
      if (link.pathname === location.pathname)
        afterScroll(() => flash(link.hash));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return <Arrival key={pathname} />;
}
