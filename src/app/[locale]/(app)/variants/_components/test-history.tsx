"use client";

import { useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { LoadMore } from "@/components/load-more";
import type { TestPage } from "@/features/exam/test-feed";
import type { TestSummary } from "@/features/exam/test-summaries";
import { useTestFeed } from "@/features/exam/use-test-feed";
import { ExamRow } from "./exam-row";
import { TestsTable } from "./tests-table";

export function TestHistory({ first }: { first: TestPage }) {
  const t = useTranslations("Variants");
  const home = useTranslations("Home");

  if (first.tests.length === 0) {
    return (
      <EmptyNote
        text={t("historyEmpty")}
        href="/daily"
        action={home("playDaily")}
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

function TestFeed({ first }: { first: TestPage }) {
  const t = useTranslations("Bank");
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useTestFeed(first);

  return (
    <>
      <TestsTable first="attempt">
        {data.pages
          .flatMap((page) => page.tests)
          .map((test) => (
            <HistoryRow key={test.id} test={test} />
          ))}
      </TestsTable>
      {hasNextPage && (
        <LoadMore
          key={data.pages.length}
          pending={isFetchingNextPage}
          failed={isFetchNextPageError}
          onLoad={() => fetchNextPage({ cancelRefetch: false })}
        >
          {t("more")}
        </LoadMore>
      )}
    </>
  );
}
