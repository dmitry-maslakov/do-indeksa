"use client";

import { useTranslations } from "next-intl";
import { EmptyNote } from "@/components/empty-note";
import { LoadMore } from "@/components/load-more";
import type { RunPage } from "@/features/exam/run-feed";
import type { RunSummary } from "@/features/exam/run-summaries";
import { useRunFeed } from "@/features/exam/use-run-feed";
import { ExamRow } from "./exam-row";
import { TestsTable } from "./tests-table";

export function RunHistory({ first }: { first: RunPage }) {
  const t = useTranslations("Variants");
  const home = useTranslations("Home");

  if (first.runs.length === 0) {
    return (
      <EmptyNote
        text={t("historyEmpty")}
        signedIn
        href="/daily"
        action={home("playDaily")}
      />
    );
  }

  return <RunFeed first={first} />;
}

function HistoryRow({ run }: { run: RunSummary }) {
  const t = useTranslations("Variants");

  return (
    <ExamRow
      title={t("runTitle", { kind: run.kind, title: run.title })}
      kind={t("runKind", { kind: run.kind, count: run.segments.length })}
      href={`/variants/${run.variantId}`}
      run={run}
    />
  );
}

function RunFeed({ first }: { first: RunPage }) {
  const t = useTranslations("Bank");
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useRunFeed(first);

  return (
    <>
      <TestsTable first="attempt">
        {data.pages
          .flatMap((page) => page.runs)
          .map((run) => (
            <HistoryRow key={run.id} run={run} />
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
