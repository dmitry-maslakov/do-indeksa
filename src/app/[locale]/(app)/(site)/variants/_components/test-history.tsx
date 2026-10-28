"use client";

import { useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { LoadMore } from "@/components/load-more";
import type { TestSummary } from "@/features/tests/summaries";
import { type Page, useFeed } from "@/lib/use-feed";
import { ExamRow } from "./exam-row";
import { TestsTable } from "./tests-table";

export function TestHistory({ first }: { first: Page<TestSummary> }) {
  const t = useTranslations("Variants");
  const home = useTranslations("Home");

  if (first.items.length === 0) {
    return (
      <EmptyNote
        text={t("historyEmpty")}
        href="/variants"
        action={home("startTest")}
      />
    );
  }

  return <TestFeed first={first} />;
}

function HistoryRow({ test }: { test: TestSummary }) {
  const t = useTranslations("Variants");

  return (
    <ExamRow
      title={t("testTitle", { kind: test.kind, title: test.title })}
      kind={t("testKind", { kind: test.kind, count: test.segments.length })}
      href={`/variants/${test.variantId}`}
      test={test}
    />
  );
}

function TestFeed({ first }: { first: Page<TestSummary> }) {
  const t = useTranslations("Bank");
  const feed = useFeed("/api/tests", first);

  return (
    <>
      <TestsTable first="attempt">
        {feed.data.pages
          .flatMap((page) => page.items)
          .map((test) => (
            <HistoryRow key={test.id} test={test} />
          ))}
      </TestsTable>
      <LoadMore key={feed.data.pages.length} feed={feed}>
        {t("more")}
      </LoadMore>
    </>
  );
}
