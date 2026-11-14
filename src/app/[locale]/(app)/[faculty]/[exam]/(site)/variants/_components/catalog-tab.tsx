import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { Await } from "@/components/await";
import {
  summarizeLatest,
  type TestSummary,
  testPage,
} from "@/features/tests/summaries";
import {
  curatedVariants,
  officialVariants,
} from "@/features/variants/variants";
import { getProfileId } from "@/server/profile";
import { ExamRow } from "./exam-row";
import { TestHistory } from "./test-history";
import { TestsTable } from "./tests-table";

export const tabs = ["official", "curated", "history"] as const;
type Tab = (typeof tabs)[number];

async function loadHistory(examId: string) {
  return testPage(await getProfileId(), examId, 0, await getLocale());
}

export async function loadLatest(examId: string, variantIds: string[]) {
  return summarizeLatest(
    await getProfileId(),
    examId,
    variantIds,
    await getLocale(),
  );
}

export async function CatalogTab({
  examId,
  searchParams,
}: Pick<PageProps<"/[locale]/variants">, "searchParams"> & {
  examId: string;
}) {
  const { tab: raw } = await searchParams;
  const tab: Tab = tabs.find((x) => x === raw) ?? "official";

  if (tab === "history") {
    return (
      <Suspense fallback={<TestsTable first="attempt">{null}</TestsTable>}>
        <Await promise={loadHistory(examId)}>
          {(first) => <TestHistory first={first} />}
        </Await>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<VariantTable tab={tab} pending />}>
      <Await
        promise={loadLatest(
          examId,
          variantsOf(tab).map((v) => v.id),
        )}
      >
        {(tests) => <VariantTable tab={tab} tests={tests} />}
      </Await>
    </Suspense>
  );
}

const variantsOf = (tab: Exclude<Tab, "history">) =>
  tab === "official" ? officialVariants : curatedVariants;

export function VariantTable({
  tab,
  tests = [],
  pending,
}: {
  tab: Exclude<Tab, "history">;
  tests?: TestSummary[];
  pending?: boolean;
}) {
  return (
    <TestsTable first={tab === "official" ? "year" : "test"}>
      {variantsOf(tab).map((v) => (
        <ExamRow
          key={v.id}
          title={v.title}
          href={`/variants/${v.id}`}
          original={v.original}
          solutions={`/variants/${v.id}/solutions`}
          test={tests.find((r) => r.variantId === v.id)}
          pending={pending}
        />
      ))}
    </TestsTable>
  );
}
