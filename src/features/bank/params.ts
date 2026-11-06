import { omit } from "es-toolkit";
import {
  createLoader,
  createParser,
  createSerializer,
  parseAsStringLiteral,
} from "nuqs/server";
import { levels } from "@/features/catalog/level";
import type { BankQuery } from "./search";

export const sorts = ["easy", "hard"] as const;

export const statusFilters = ["new", "solved", "wrong"] as const;

export const sources = ["exam", "ours"] as const;

export const bankParsers = {
  q: createParser({
    parse: (value) => {
      const query = value.trim();
      return query && query.length <= 100 ? query : null;
    },
    serialize: String,
  }),
  number: createParser({
    parse: (value) => {
      const number = Number(value);
      return Number.isInteger(number) && number > 0 ? number : null;
    },
    serialize: String,
  }),
  topic: createParser({ parse: (value) => value || null, serialize: String }),
  source: parseAsStringLiteral(sources),
  level: parseAsStringLiteral(levels),
  sort: parseAsStringLiteral(sorts),
  status: parseAsStringLiteral(statusFilters),
};

export const queryParsers = omit(bankParsers, ["topic"]);

export const loadBankFilters = createLoader(bankParsers);

export const serializeBankFilters = createSerializer(bankParsers);

const serializeQuery = createSerializer(queryParsers);

export const bankHref = ({ topic, ...query }: BankQuery) =>
  serializeQuery(topic ? `/bank/topic/${topic}` : "/bank", query);

export const firstPageSize = 3;

export const pageSize = 10;

export const pageOffset = (page: number) =>
  firstPageSize + (page - 2) * pageSize;

export const pageAt = (offset: number) =>
  (offset - firstPageSize) / pageSize + 2;

export const pageCount = (tasks: number) =>
  1 + Math.ceil(Math.max(0, tasks - firstPageSize) / pageSize);

export function pageOf(value: string) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 2 && String(page) === value
    ? page
    : undefined;
}

export const pagedTopic = ({ topic, ...query }: BankQuery) =>
  topic && !serializeQuery(query) ? topic : undefined;

export const bankPageHref = (topic: string, page: number) =>
  `${bankHref({ topic })}/${page}`;
