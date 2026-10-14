import { useQueryStates } from "nuqs";
import { bankParsers } from "./bank-params";

export const useBankFilters = () =>
  useQueryStates(bankParsers, { history: "push", shallow: false });
