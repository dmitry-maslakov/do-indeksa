"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LinkTabs } from "@/components/link-tabs";
import { RailContent, RailLink, RailSelect } from "@/components/rail";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useRouter } from "@/i18n/navigation";
import { SectionLinks } from "./section-links";

interface TheoryRailProps {
  topic: string;
  topics: { id: string; name: string }[];
  sections: { id: string; title: string }[];
  methods: { slug: string; name: ReactNode; when: ReactNode }[];
}

export function TheoryRail({
  topic,
  topics,
  sections,
  methods,
}: TheoryRailProps) {
  const t = useTranslations("Theory");
  const router = useRouter();
  const [view, current] = useSelectedLayoutSegments();
  const base = `/theory/${topic}`;
  const href = (slug: string) => `${base}/methods/${slug}`;
  const first = methods[0];

  return (
    <RailContent>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <RailSelect
          label={t("topic")}
          value={topic}
          onChange={(e) => router.push(`/theory/${e.target.value}`)}
        >
          {topics.map((x) => (
            <NativeSelectOption key={x.id} value={x.id}>
              {x.name}
            </NativeSelectOption>
          ))}
        </RailSelect>
        <LinkTabs
          label={t("title")}
          variant="fill"
          scroll
          control="theory_tab"
          items={[
            { href: base, label: t("theory"), active: !view, value: "theory" },
            {
              href: first ? href(first.slug) : `${base}/methods`,
              label: t("methods"),
              active: !!view,
              value: "methods",
            },
          ]}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3">
        {view ? (
          methods.map((m) => (
            <RailLink
              key={m.slug}
              href={href(m.slug)}
              current={m.slug === current}
              className="flex-col gap-0.5 px-3 py-2.5 leading-snug"
            >
              <span>{m.name}</span>
              <span className="font-normal text-subtle text-xs">{m.when}</span>
            </RailLink>
          ))
        ) : (
          <SectionLinks base={base} sections={sections} />
        )}
      </div>
    </RailContent>
  );
}
