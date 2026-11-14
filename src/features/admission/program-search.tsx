"use client";

import { cn } from "cn";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  Suspense,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import { fold } from "@/lib/text";

interface Search {
  query: string;
  count: number;
  setQuery: (query: string) => void;
  field: RefObject<HTMLInputElement | null>;
}

const SearchContext = createContext<Search | null>(null);

function useSearch() {
  const search = use(SearchContext);
  if (!search) throw new Error("ProgramSearch is missing");
  return search;
}

const normalize = (s: string) => fold(s).trim().replace(/\s+/g, " ");

const matches = (key: string, query: string) => key.includes(normalize(query));

const queryParser = parseAsString
  .withDefault("")
  .withOptions({ history: "replace" });

export function ProgramSearch({
  keys,
  children,
}: {
  keys: string[];
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const count = keys.filter((key) => matches(key, query)).length;

  return (
    <NuqsAdapter>
      <SearchContext value={{ query, count, setQuery, field }}>
        {children}
      </SearchContext>
    </NuqsAdapter>
  );
}

const fieldClass =
  "pl-10 md:text-base [&::-webkit-search-cancel-button]:hidden";

function UrlField(props: ComponentProps<typeof Input>) {
  const [q, setQ] = useQueryState("q", queryParser);
  const { setQuery, field } = useSearch();

  useEffect(() => setQuery(q), [q, setQuery]);

  return (
    <Input
      {...props}
      ref={field}
      value={q}
      onChange={(e) => setQ(e.currentTarget.value || null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setQ(null);
      }}
    />
  );
}

function LiveCount() {
  const t = useTranslations("ProgramSearch");
  const { query, count } = useSearch();
  return (
    <p className="sr-only" aria-live="polite">
      {normalize(query) &&
        (count > 0
          ? t("found", { count })
          : t("none", { query: query.trim() }))}
    </p>
  );
}

export function SearchField({
  controls,
  className,
}: {
  controls: string;
  className?: string;
}) {
  const t = useTranslations("ProgramSearch");
  const props = {
    type: "search",
    autoComplete: "off",
    spellCheck: false,
    enterKeyHint: "search",
    placeholder: t("placeholder"),
    "aria-label": t("label"),
    "aria-controls": controls,
    className: fieldClass,
  } as const;

  return (
    <>
      <search className={cn("relative block noscript:hidden", className)}>
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 left-3.5 z-10 size-4 text-subtle"
        />
        <Suspense fallback={<Input {...props} />}>
          <UrlField {...props} />
        </Suspense>
      </search>
      <LiveCount />
    </>
  );
}

function ClearButton() {
  const t = useTranslations("ProgramSearch");
  const [, setQ] = useQueryState("q", queryParser);
  const { field } = useSearch();
  return (
    <button
      type="button"
      onClick={() => {
        setQ(null);
        field.current?.focus();
      }}
      className="font-medium text-data underline-offset-3 hover:underline"
    >
      {t("clear")}
    </button>
  );
}

export function NoResults() {
  const t = useTranslations("ProgramSearch");
  const { query, count } = useSearch();
  if (!normalize(query) || count > 0) return null;
  return (
    <p className="pt-4 pb-1 text-[15px]">
      {t("none", { query: query.trim() })} <ClearButton />
    </p>
  );
}

export function FilterGroup({
  keys,
  children,
}: {
  keys: string[];
  children: ReactNode;
}) {
  const { query } = useSearch();
  return (
    <div className="contents" hidden={!keys.some((key) => matches(key, query))}>
      {children}
    </div>
  );
}

export function FilterRow({
  searchKey,
  ...props
}: ComponentProps<"tr"> & { searchKey: string }) {
  const { query } = useSearch();
  return <tr {...props} hidden={!matches(searchKey, query)} />;
}
