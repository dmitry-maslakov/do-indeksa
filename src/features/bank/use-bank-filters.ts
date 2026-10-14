import { useQueryStates } from "nuqs";
import { bankParsers } from "./params";

export const useBankFilters = () =>
  useQueryStates(bankParsers, {
    history: "push",
    shallow: false,
    scroll: true,
  });
