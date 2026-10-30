"use client";

import { useEffect, useState } from "react";
import { RailLink } from "@/components/rail";
import { queueEvent } from "@/lib/analytics-browser";

interface SectionLinksProps {
  base: string;
  sections: { id: string; title: string }[];
}

export function SectionLinks({ base, sections }: SectionLinksProps) {
  const [current, setCurrent] = useState(sections[0]?.id);

  useEffect(() => {
    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter((heading) => heading !== null);
    const update = () => {
      const end =
        scrollY > 0 &&
        innerHeight + scrollY >= document.documentElement.scrollHeight - 1;
      const heading = end
        ? (headings.find((h) => `#${h.id}` === location.hash) ??
          headings.at(-1))
        : headings.findLast(
            (h) => h.getBoundingClientRect().top < innerHeight / 3,
          );
      setCurrent((heading ?? headings[0])?.id);
    };
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, [sections]);

  return sections.map((s) => (
    <RailLink
      key={s.id}
      href={`${base}#${s.id}`}
      current={s.id === current}
      onClick={() => {
        setCurrent(s.id);
        queueEvent("control_used", {
          control: "theory_section_link",
          value: s.id,
        });
      }}
      className="px-3 py-2.5 leading-snug"
    >
      {s.title}
    </RailLink>
  ));
}
