import {
  createLoader,
  createParser,
  createSerializer,
  parseAsStringLiteral,
} from "nuqs/server";

export const levels = ["easy", "medium", "hard"] as const;
export type Level = (typeof levels)[number];

const sorts = ["easy", "hard"] as const;

export const statusFilters = ["new", "solved", "wrong", "favorite"] as const;

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
  level: parseAsStringLiteral(levels),
  sort: parseAsStringLiteral(sorts),
  status: parseAsStringLiteral(statusFilters),
};

export const loadBankFilters = createLoader(bankParsers);

export const serializeBankFilters = createSerializer(bankParsers);
